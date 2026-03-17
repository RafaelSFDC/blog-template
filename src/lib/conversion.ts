import { resolveSitePresetKey } from "#/lib/site-presets";
import type { LegacySitePresetKey, SitePresetKey } from "#/types/system";
import type { SubscriptionStatus } from "#/types/membership";

export type PaywallVariantKey =
  | "practical-benefit"
  | "reading-continuity"
  | "membership-exclusivity";

export interface PricingComparisonPlanViewModel {
  slug: "monthly" | "annual";
  name: string;
  interval: "month" | "year";
  priceCents: number | null;
  currency: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  badge?: string;
  priceLabel: string;
  billingLabel: string;
}

export interface PricingComparisonViewModel {
  plans: PricingComparisonPlanViewModel[];
  annualSavingsLabel: string | null;
  recommendedPlanSlug: "monthly" | "annual" | null;
  recommendedReason: string | null;
  benefitRows: Array<{
    label: string;
    monthly: string;
    annual: string;
  }>;
  faqItems: Array<{
    question: string;
    answer: string;
  }>;
}

export interface AccountRetentionState {
  key: "active" | "grace_period" | "canceled" | "past_due" | "inactive";
  title: string;
  description: string;
  primaryAction: {
    label: string;
    kind: "billing_portal" | "pricing" | "read";
    trackingSource: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  statusLabel: string;
  valueBullets: string[];
}

function formatMoney(amount?: number | null, currency = "usd") {
  if (amount == null) {
    return "Configured in Stripe";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function resolvePaywallVariant(input: {
  sitePresetKey?: SitePresetKey | LegacySitePresetKey | null;
  teaserMode?: string | null;
  isPremium: boolean;
}): PaywallVariantKey {
  if (resolveSitePresetKey(input.sitePresetKey) === "premium_publication") {
    return "membership-exclusivity";
  }

  if (input.teaserMode === "excerpt") {
    return "reading-continuity";
  }

  return input.isPremium ? "practical-benefit" : "reading-continuity";
}

export function buildPaywallCopy(input: {
  variant: PaywallVariantKey;
  blogName: string;
}) {
  if (input.variant === "membership-exclusivity") {
    return {
      title: "Unlock the members archive",
      description:
        "Join the premium tier to access the full story, deeper reporting, and the archive reserved for paying readers.",
      newsletterTitle: "Start with the free briefing",
      newsletterDescription:
        "Get the editorial voice in your inbox before you decide to upgrade.",
      benefits: [
        "Full access to premium stories and archive",
        "A calmer upgrade path from free to paid",
        "Direct support for the publication",
      ],
    };
  }

  if (input.variant === "reading-continuity") {
    return {
      title: "Keep reading without losing the thread",
      description:
        "Get the free editorial briefing first, then upgrade when you want the full post and the premium archive.",
      newsletterTitle: "Get the next edition first",
      newsletterDescription:
        "Stay close to the publication while deciding when to become a paying member.",
      benefits: [
        "Free editorial notes in your inbox",
        "A clear upgrade path to the full article",
        "Premium access whenever you are ready",
      ],
    };
  }

  return {
    title: `Turn ${input.blogName} into a habit`,
    description:
      "Subscribe to the free newsletter now and upgrade when you want the full archive, premium posts, and uninterrupted reading.",
    newsletterTitle: "Join the free newsletter",
    newsletterDescription:
      "Start with free issues and move to paid membership when the publication becomes part of your routine.",
    benefits: [
      "Immediate newsletter access",
      "Premium archive when you upgrade",
      "Support work you want to keep reading",
    ],
  };
}

export function buildPricingComparison(input: {
  plans: Array<{
    slug: string;
    name: string;
    description: string | null;
    interval: string;
    priceCents: number | null;
    currency: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
}): PricingComparisonViewModel {
  const normalizedPlans = input.plans
    .filter((plan) => plan.slug === "monthly" || plan.slug === "annual")
    .map((plan) => ({
      slug: plan.slug as "monthly" | "annual",
      name: plan.name,
      interval: (plan.interval === "year" ? "year" : "month") as "year" | "month",
      priceCents: plan.priceCents,
      currency: plan.currency,
      description: plan.description ?? "Full premium access for committed readers.",
      isDefault: Boolean(plan.isDefault),
      isActive: Boolean(plan.isActive),
      badge: plan.isDefault ? "Recommended" : undefined,
      priceLabel: formatMoney(plan.priceCents, plan.currency),
      billingLabel: plan.interval === "year" ? "per year" : "per month",
    }));

  const annualPlan = normalizedPlans.find((plan) => plan.slug === "annual");
  const monthlyPlan = normalizedPlans.find((plan) => plan.slug === "monthly");
  const annualSavingsLabel =
    annualPlan?.priceCents && monthlyPlan?.priceCents
      ? (() => {
          const equivalentAnnualMonthly = monthlyPlan.priceCents * 12;
          if (equivalentAnnualMonthly <= annualPlan.priceCents) {
            return null;
          }

          const savings = equivalentAnnualMonthly - annualPlan.priceCents;
          const percent = Math.round((savings / equivalentAnnualMonthly) * 100);
          return `Save ${percent}% with annual billing`;
        })()
      : null;
  const recommendedPlanSlug =
    normalizedPlans.find((plan) => plan.isDefault)?.slug ??
    annualPlan?.slug ??
    monthlyPlan?.slug ??
    null;
  const recommendedReason =
    recommendedPlanSlug === "annual" && annualSavingsLabel
      ? `${annualSavingsLabel}. Best for committed readers who already value the publication.`
      : recommendedPlanSlug === "annual"
        ? "Best value for readers ready to stay with the publication for the long run."
        : recommendedPlanSlug === "monthly"
          ? "Best for readers who want premium access now with a lighter commitment."
          : null;

  return {
    plans: normalizedPlans,
    annualSavingsLabel,
    recommendedPlanSlug,
    recommendedReason,
    benefitRows: [
      {
        label: "Premium posts and pages",
        monthly: "Included",
        annual: "Included",
      },
      {
        label: "Members-only archive",
        monthly: "Included",
        annual: "Included",
      },
      {
        label: "Billing commitment",
        monthly: "Flexible",
        annual: "Best value",
      },
    ],
    faqItems: [
      {
        question: "Can I cancel any time?",
        answer: "Yes. Readers can manage, cancel, or update billing through the self-service portal.",
      },
      {
        question: "Why choose annual?",
        answer: "Annual billing gives committed readers the best value and reduces renewal friction over time.",
      },
      {
        question: "What stays free?",
        answer: "Free readers can still join the newsletter and sample public posts before upgrading.",
      },
    ],
  };
}

export function buildAccountRetentionState(input: {
  effectiveStatus?: SubscriptionStatus | null;
  hasBillingPortal: boolean;
  currentPeriodEnd?: Date | string | null;
}): AccountRetentionState {
  const status = input.effectiveStatus ?? "inactive";

  if (status === "active") {
    return {
      key: "active",
      title: "Everything is healthy",
      description: "Your membership is active and premium access is fully available.",
      primaryAction: {
        label: input.hasBillingPortal ? "Manage billing" : "See plans",
        kind: input.hasBillingPortal ? "billing_portal" : "pricing",
        trackingSource: "account_active",
      },
      secondaryAction: {
        label: "Return to the archive",
        href: "/blog",
      },
      statusLabel: "Active membership",
      valueBullets: [
        "Premium posts and pages stay unlocked",
        "Billing remains self-serve when you need changes",
        "You can go straight back to reading",
      ],
    };
  }

  if (status === "past_due") {
    return {
      key: "past_due",
      title: "Your access is at risk",
      description: "Payment needs attention. Fix billing now to keep premium access uninterrupted.",
      primaryAction: {
        label: "Fix billing",
        kind: input.hasBillingPortal ? "billing_portal" : "pricing",
        trackingSource: "account_past_due",
      },
      secondaryAction: {
        label: "Review membership value",
        href: "/pricing",
      },
      statusLabel: "Payment issue",
      valueBullets: [
        "Premium access may expire after the grace window",
        "Updating payment details is the fastest save action",
        "Returning now avoids churn caused by billing friction",
      ],
    };
  }

  if (status === "canceled") {
    return {
      key: "grace_period",
      title: "Your membership will end soon",
      description: "You still have access for now. Reopen billing or choose a plan to keep your premium archive unlocked.",
      primaryAction: {
        label: input.hasBillingPortal ? "Reactivate billing" : "Choose a plan",
        kind: input.hasBillingPortal ? "billing_portal" : "pricing",
        trackingSource: "account_grace_period",
      },
      secondaryAction: {
        label: "Keep reading while active",
        href: "/blog",
      },
      statusLabel: "Ending soon",
      valueBullets: [
        "Current access remains live until the period ends",
        "Reactivation is easier before access fully expires",
        "This is the best moment to save the subscription",
      ],
    };
  }

  if (status === "expired") {
    return {
      key: "canceled",
      title: "Premium access has ended",
      description: "Restart membership to regain the full archive, premium posts, and uninterrupted reading.",
      primaryAction: {
        label: "Restart membership",
        kind: "pricing",
        trackingSource: "account_reactivation",
      },
      secondaryAction: {
        label: "Browse public stories",
        href: "/blog",
      },
      statusLabel: "Expired membership",
      valueBullets: [
        "Public content remains available",
        "Premium archive returns immediately after subscribing",
        "You can restart with the plan that fits best now",
      ],
    };
  }

  return {
    key: "inactive",
    title: "You are on the free path",
    description: "Start with the newsletter or choose a membership plan when you want full archive access.",
    primaryAction: {
      label: "See membership plans",
      kind: "pricing",
      trackingSource: "account_free_reader",
    },
    secondaryAction: {
      label: "Read public posts",
      href: "/blog",
    },
    statusLabel: "Free reader",
    valueBullets: [
      "Newsletter signup stays available for free readers",
      "Membership unlocks premium posts and pages",
      "Upgrade only when the publication proves valuable",
    ],
  };
}
