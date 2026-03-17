import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "#/server/db/index";
import { appSettings, membershipPlans, subscriptionEvents, subscriptions, user } from "#/server/db/schema";
import { buildAccountRetentionState } from "#/lib/conversion";
import { requireSession } from "#/server/auth/session";
import { stripeCheckoutSchema } from "#/schemas/membership";
import {
  DEFAULT_GRACE_PERIOD_DAYS,
  getEffectiveSubscriptionStatus,
  getEntitlementAccess,
  hasPremiumEntitlement,
  mapStripeStatusToSubscriptionStatus,
} from "#/lib/membership";
import { stripe } from "#/server/stripe";
import { resolveExternalBaseUrl } from "#/server/system/runtime-config";

function toDate(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

function normalizeRole(value?: string | null) {
  return value === "superAdmin" ? "super-admin" : value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function getSettingValue(key: string) {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, key),
  });
  return row?.value ?? undefined;
}

export async function getGracePeriodDays() {
  const raw = await getSettingValue("membershipGracePeriodDays");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_GRACE_PERIOD_DAYS;
}

async function ensureMembershipPlans() {
  const monthlyPriceId = await getSettingValue("stripeMonthlyPriceId") ?? await getSettingValue("stripePriceId");
  const annualPriceId = await getSettingValue("stripeAnnualPriceId");

  const defaults = [
    {
      slug: "monthly",
      name: "Monthly",
      description: "Flexible month-to-month access to all premium content.",
      interval: "month",
      stripePriceId: monthlyPriceId ?? null,
      isDefault: annualPriceId ? false : true,
    },
    {
      slug: "annual",
      name: "Annual",
      description: "Best value for readers who want full-year premium access.",
      interval: "year",
      stripePriceId: annualPriceId ?? null,
      isDefault: annualPriceId ? true : false,
    },
  ] as const;

  for (const plan of defaults) {
    let priceCents: number | null = null;
    let currency = "usd";

    if (plan.stripePriceId) {
      try {
        const stripePrice = await stripe.prices.retrieve(plan.stripePriceId);
        priceCents = stripePrice.unit_amount ?? null;
        currency = stripePrice.currency ?? "usd";
      } catch {
        priceCents = null;
      }
    }

    const existing = await db.query.membershipPlans.findFirst({
      where: eq(membershipPlans.slug, plan.slug),
    });

    if (!existing) {
      await db.insert(membershipPlans).values({
        ...plan,
        priceCents,
        currency,
        isActive: Boolean(plan.stripePriceId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      continue;
    }

    await db
      .update(membershipPlans)
      .set({
        name: plan.name,
        description: plan.description,
        interval: plan.interval,
        stripePriceId: plan.stripePriceId,
        priceCents,
        currency,
        isActive: Boolean(plan.stripePriceId),
        isDefault: plan.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(membershipPlans.id, existing.id));
  }
}

export async function getPricingPlansData() {
  await ensureMembershipPlans();
  return db.query.membershipPlans.findMany({
    where: sql`${membershipPlans.slug} in ('monthly', 'annual')`,
    orderBy: [membershipPlans.id],
  });
}

function getAppBaseUrl() {
  return resolveExternalBaseUrl({
    envVarName: "APP_URL",
    label: "APP_URL",
  });
}

export async function getCurrentSubscription(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: [desc(subscriptions.updatedAt)],
    with: {
      membershipPlan: true,
    },
  });

  if (!subscription) {
    return null;
  }

  const effectiveStatus = getEffectiveSubscriptionStatus({
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    gracePeriodEndsAt: subscription.gracePeriodEndsAt,
    canceledAt: subscription.canceledAt,
  });

  return {
    ...subscription,
    effectiveStatus,
    hasPremiumAccess: hasPremiumEntitlement(effectiveStatus),
  };
}

export async function getUserEntitlement(input?: {
  userId?: string | null;
  role?: string | null;
  isPremium?: boolean;
}) {
  const resolvedInput = input ?? {};
  const normalizedRole = normalizeRole(resolvedInput.role);
  if (normalizedRole === "admin" || normalizedRole === "super-admin") {
    return {
      access: getEntitlementAccess({
        isPremium: Boolean(resolvedInput.isPremium),
        hasEntitlement: true,
        isAdmin: true,
      }),
      status: "active" as const,
      subscription: null,
    };
  }

  if (!resolvedInput.userId) {
    return {
      access: getEntitlementAccess({
        isPremium: Boolean(resolvedInput.isPremium),
        hasEntitlement: false,
        isAdmin: false,
      }),
      status: "inactive" as const,
      subscription: null,
    };
  }

  const subscription = await getCurrentSubscription(resolvedInput.userId);
  const hasEntitlement = Boolean(subscription?.hasPremiumAccess);

  return {
    access: getEntitlementAccess({
      isPremium: Boolean(resolvedInput.isPremium),
      hasEntitlement,
      isAdmin: false,
    }),
    status: subscription?.effectiveStatus ?? "inactive",
    subscription,
  };
}

async function upsertSubscriptionFromStripe(input: {
  stripeSubscription: Stripe.Subscription;
  userId?: string | null;
  eventType: string;
}) {
  await ensureMembershipPlans();
  const graceDays = await getGracePeriodDays();
  const stripeSubscription = input.stripeSubscription;
  const stripePriceId = stripeSubscription.items.data[0]?.price.id ?? null;
  const plan = stripePriceId
    ? await db.query.membershipPlans.findFirst({
        where: eq(membershipPlans.stripePriceId, stripePriceId),
      })
    : null;

  const nextStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
  const now = new Date();
  const currentPeriodEnd =
    stripeSubscription.items.data[0]?.current_period_end
      ? new Date(stripeSubscription.items.data[0].current_period_end * 1000)
      : null;
  const gracePeriodEndsAt =
    nextStatus === "past_due"
      ? new Date((currentPeriodEnd?.getTime() ?? now.getTime()) + graceDays * 24 * 60 * 60 * 1000)
      : null;

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
  });

  const userId = input.userId ?? existing?.userId;
  if (!userId) {
    throw new Error("Could not resolve subscription owner");
  }

  const values = {
    userId,
    membershipPlanId: plan?.id ?? null,
    stripeCustomerId:
      typeof stripeSubscription.customer === "string" ? stripeSubscription.customer : null,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId,
    status: nextStatus,
    currentPeriodStart: toDate(stripeSubscription.items.data[0]?.current_period_start ?? null),
    currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
    endedAt:
      stripeSubscription.ended_at
        ? new Date(stripeSubscription.ended_at * 1000)
        : nextStatus === "expired"
          ? now
          : null,
    gracePeriodEndsAt,
    updatedAt: now,
  };

  let subscriptionId = existing?.id ?? null;

  if (existing) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
  } else {
    const [created] = await db
      .insert(subscriptions)
      .values({
        ...values,
        createdAt: now,
      })
      .returning({ id: subscriptions.id });
    subscriptionId = created.id;
  }

  await db
    .update(user)
    .set({
      stripeCustomerId: values.stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      updatedAt: now,
    })
    .where(eq(user.id, values.userId));

  return {
    subscriptionId,
    eventType: input.eventType,
    userId: values.userId,
  };
}

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
};

export async function processStripeWebhookEvent(event: StripeWebhookEvent) {
  const existing = await db.query.subscriptionEvents.findFirst({
    where: eq(subscriptionEvents.stripeEventId, event.id),
  });

  if (existing) {
    return { processed: false, duplicate: true };
  }

  let subscriptionId: number | null = null;
  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;

  if (event.type === "checkout.session.completed") {
    const sessionObject = asRecord(event.data.object);
    const metadata = asRecord(sessionObject?.metadata);
    stripeCustomerId = asString(sessionObject?.customer);
    stripeSubscriptionId = asString(sessionObject?.subscription);

    if (stripeSubscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const result = await upsertSubscriptionFromStripe({
        stripeSubscription,
        userId: asString(metadata?.userId),
        eventType: event.type,
      });
      subscriptionId = result.subscriptionId;
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const eventSubscription = asRecord(event.data.object);
    stripeSubscriptionId = asString(eventSubscription?.id);
    stripeCustomerId = asString(eventSubscription?.customer);

    if (!stripeSubscriptionId) {
      throw new Error("Stripe subscription id missing in webhook payload");
    }

    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
    });

    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const result = await upsertSubscriptionFromStripe({
      stripeSubscription,
      userId: existingSubscription?.userId ?? null,
      eventType: event.type,
    });
    subscriptionId = result.subscriptionId;
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = asRecord(event.data.object);
    stripeCustomerId = asString(invoice?.customer);

    const parent = asRecord(invoice?.parent);
    const parentType = asString(parent?.type);
    const subscriptionDetails = asRecord(parent?.subscription_details);
    const parentSubscription = asString(subscriptionDetails?.subscription);
    const directSubscription = asString(invoice?.subscription);
    stripeSubscriptionId =
      parentType === "subscription_details" ? parentSubscription : directSubscription;

    if (stripeSubscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
      });
      const result = await upsertSubscriptionFromStripe({
        stripeSubscription,
        userId: existingSubscription?.userId ?? null,
        eventType: event.type,
      });
      subscriptionId = result.subscriptionId;
    }
  }

  await db.insert(subscriptionEvents).values({
    subscriptionId,
    stripeEventId: event.id,
    stripeCustomerId,
    stripeSubscriptionId,
    type: event.type,
    payloadJson: JSON.stringify(event),
    processedAt: new Date(),
    createdAt: new Date(),
  });

  return { processed: true, duplicate: false };
}

export const getPricingPlans = createServerFn({ method: "GET" }).handler(async () => {
  const plans = await getPricingPlansData();
  type PricingPlan = (typeof plans)[number];
  return plans.map((plan: PricingPlan) => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    interval: plan.interval,
    stripePriceId: plan.stripePriceId,
    priceCents: plan.priceCents,
    currency: plan.currency,
    isDefault: Boolean(plan.isDefault),
    isActive: Boolean(plan.isActive),
  }));
});

export const getCurrentSubscriptionSummary = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireSession();
  const sessionUser = session.user as typeof session.user & {
    stripeCustomerId?: string | null;
  };
  const subscription = await getCurrentSubscription(session.user.id);
  const plans = await getPricingPlansData();
  const hasBillingPortal = Boolean(
    subscription?.stripeCustomerId ?? sessionUser.stripeCustomerId,
  );

  return {
    subscription,
    plans,
    retention: buildAccountRetentionState({
      effectiveStatus: subscription?.effectiveStatus,
      hasBillingPortal,
      currentPeriodEnd: subscription?.currentPeriodEnd,
    }),
    hasBillingPortal,
  };
});

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => stripeCheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const plans = await getPricingPlansData();
    type PricingPlan = (typeof plans)[number];
    const selectedPlan =
      (data.planSlug
        ? plans.find((plan: PricingPlan) => plan.slug === data.planSlug)
        : data.priceId
          ? plans.find((plan: PricingPlan) => plan.stripePriceId === data.priceId)
          : plans.find((plan: PricingPlan) => plan.isDefault)) ?? null;

    if (!selectedPlan?.stripePriceId) {
      throw new Error("No membership plan is configured for checkout");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      line_items: [
        {
          price: selectedPlan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${getAppBaseUrl()}/account?success=true`,
      cancel_url: `${getAppBaseUrl()}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        planSlug: selectedPlan.slug,
      },
    });

    return {
      url: checkoutSession.url,
      planSlug: selectedPlan.slug,
      priceId: selectedPlan.stripePriceId,
    };
  });

export const createBillingPortalSession = createServerFn({ method: "POST" }).handler(async () => {
  const session = await requireSession();
  const sessionUser = session.user as typeof session.user & {
    stripeCustomerId?: string | null;
  };
  const subscription = await getCurrentSubscription(session.user.id);
  const customerId = subscription?.stripeCustomerId ?? sessionUser.stripeCustomerId;

  if (!customerId) {
    throw new Error("No billing customer is linked to this account");
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppBaseUrl()}/account`,
  });

  return {
    url: portal.url,
  };
});

