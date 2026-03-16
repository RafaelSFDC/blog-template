import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "#/db/index";
import {
  newsletterDeliveries,
  newsletterConsents,
  newsletterLogs,
  newsletters,
  subscribers,
  subscriberEvents,
  subscriptions,
  user,
} from "#/db/schema";
import { getBinding } from "#/server/system/cf-env";
import { resend as defaultResend } from "#/server/integrations/resend";
import { getEffectiveSubscriptionStatus, hasPremiumEntitlement } from "#/lib/membership";
import { logActivity } from "#/server/activity-log";
import { getSettingValue, getSettingValues, parseBooleanSetting } from "#/server/app-settings";
import { getPostHogClient } from "#/server/posthog";
import { captureServerException } from "#/server/sentry";
import type { ConsentStatus } from "#/types/security";
import type { SecurityRequestMetadata } from "#/server/security/request";

const MAX_NEWSLETTER_ATTEMPTS = 3;
const NEWSLETTER_QUEUE_NAME = "NEWSLETTER_QUEUE";
const DEFAULT_SENDER_EMAIL = "newsletter@resend.dev";
const DEFAULT_SITE_URL = "http://localhost:3000";
const OPEN_PIXEL =
  "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

type NewsletterSegment = "all_active" | "premium_members" | "free_subscribers";
type NewsletterCampaignAction = "draft" | "schedule" | "queue";

export type NewsletterQueueMessage =
  | { type: "campaign"; newsletterId: number }
  | { type: "delivery"; newsletterId: number; deliveryId: number; attempt: number };

type ResendWebhookPayload = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
  };
};

function getNewsletterSecret() {
  return (
    process.env.NEWSLETTER_TOKEN_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "lumina-newsletter-secret"
  );
}

function createSignature(payload: string) {
  return createHmac("sha256", getNewsletterSecret()).update(payload).digest("hex");
}

function decodeToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Invalid token");
  }

  const expected = createSignature(encoded);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Invalid token");
  }

  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
    purpose: string;
    subscriberId: string;
    email: string;
    expiresAt: string;
  };

  if (Number(parsed.expiresAt) < Date.now()) {
    throw new Error("Token expired");
  }

  return parsed;
}

export function createNewsletterActionToken(input: {
  purpose: "confirm" | "unsubscribe";
  subscriberId: number;
  email: string;
  expiresAt: Date;
}) {
  const payload = Buffer.from(
    JSON.stringify({
      purpose: input.purpose,
      subscriberId: String(input.subscriberId),
      email: input.email.toLowerCase(),
      expiresAt: String(input.expiresAt.getTime()),
    }),
    "utf8",
  ).toString("base64url");

  return `${payload}.${createSignature(payload)}`;
}

async function getNewsletterSettings() {
  const settings = await getSettingValues([
    "siteUrl",
    "newsletterSenderEmail",
    "doubleOptInEnabled",
    "blogName",
  ]);

  return {
    siteUrl: settings.siteUrl || process.env.APP_URL || DEFAULT_SITE_URL,
    senderEmail: settings.newsletterSenderEmail || DEFAULT_SENDER_EMAIL,
    doubleOptInEnabled: parseBooleanSetting(settings.doubleOptInEnabled, false),
    blogName: settings.blogName || "Lumina",
  };
}

async function getResendClient() {
  const apiKey = await getSettingValue("resendApiKey");
  if (!apiKey) {
    return defaultResend;
  }

  const { Resend } = await import("resend");
  return new Resend(apiKey);
}

async function trackNewsletterEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
) {
  try {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId,
      event,
      properties,
    });
    await posthog.shutdownAsync();
  } catch (error) {
    console.warn("Failed to capture newsletter event", error);
  }
}

async function createSubscriberEvent(
  subscriberId: number,
  type: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(subscriberEvents).values({
    subscriberId,
    type,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
  });
}

export async function recordNewsletterConsent(input: {
  subscriberId?: number | null;
  email: string;
  source?: string | null;
  status: ConsentStatus;
  requestMetadata?: Pick<SecurityRequestMetadata, "ipHash" | "userAgentShort"> | null;
}) {
  await db.insert(newsletterConsents).values({
    subscriberId: input.subscriberId ?? null,
    email: input.email.toLowerCase(),
    source: input.source ?? null,
    status: input.status,
    lawfulBasis: "consent",
    ipHash: input.requestMetadata?.ipHash ?? null,
    userAgent: input.requestMetadata?.userAgentShort ?? null,
    createdAt: new Date(),
  });
}

async function resolveSubscriberHasPremiumAccess(email: string) {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!foundUser) {
    return false;
  }

  const foundSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, foundUser.id),
    orderBy: [desc(subscriptions.updatedAt)],
  });

  if (!foundSubscription) {
    return false;
  }

  const status = getEffectiveSubscriptionStatus({
    status: foundSubscription.status,
    currentPeriodEnd: foundSubscription.currentPeriodEnd,
    gracePeriodEndsAt: foundSubscription.gracePeriodEndsAt,
    canceledAt: foundSubscription.canceledAt,
  });

  return hasPremiumEntitlement(status);
}

async function listSegmentSubscribers(segment: NewsletterSegment) {
  const activeSubscribers = await db.query.subscribers.findMany({
    where: eq(subscribers.status, "active"),
    orderBy: [desc(subscribers.createdAt)],
  });

  if (segment === "all_active") {
    return activeSubscribers;
  }

  const filtered: typeof activeSubscribers = [];
  for (const subscriber of activeSubscribers) {
    const isPremium = await resolveSubscriberHasPremiumAccess(subscriber.email);
    if (segment === "premium_members" && isPremium) {
      filtered.push(subscriber);
    }
    if (segment === "free_subscribers" && !isPremium) {
      filtered.push(subscriber);
    }
  }

  return filtered;
}

function withSearchParams(path: string, params: Record<string, string>) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}

function replaceLinksWithTracking(html: string, deliveryId: number, siteUrl: string) {
  return html.replace(/href=(["'])(https?:\/\/[^"'<>]+)\1/gi, (_match, quote: string, href: string) => {
    const trackedHref = `${siteUrl}${withSearchParams("/api/newsletter/click", {
      deliveryId: String(deliveryId),
      url: href,
    })}`;
    return `href=${quote}${trackedHref}${quote}`;
  });
}

function buildNewsletterHtml(input: {
  html: string;
  deliveryId: number;
  unsubscribeToken: string;
  siteUrl: string;
  blogName: string;
}) {
  const trackedHtml = replaceLinksWithTracking(input.html, input.deliveryId, input.siteUrl);
  const unsubscribeUrl = `${input.siteUrl}${withSearchParams("/api/newsletter/unsubscribe", {
    token: input.unsubscribeToken,
  })}`;
  const pixelUrl = `${input.siteUrl}${withSearchParams("/api/newsletter/open", {
    deliveryId: String(input.deliveryId),
  })}`;

  return `
    <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
      ${trackedHtml}
      <img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;border:0;outline:none;" />
      <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
        You are receiving this email from ${input.blogName}.
        <a href="${unsubscribeUrl}">Unsubscribe</a>
      </p>
    </div>
  `;
}

async function enqueueMessage(message: NewsletterQueueMessage) {
  const queue = getBinding<{ send: (body: unknown) => Promise<void> }>(NEWSLETTER_QUEUE_NAME);
  if (!queue) {
    console.warn("Newsletter queue binding not found; message not enqueued.", message);
    return false;
  }

  await queue.send(message);
  return true;
}

async function finalizeCampaignStatus(newsletterId: number) {
  const deliveries = await db.query.newsletterDeliveries.findMany({
    where: eq(newsletterDeliveries.newsletterId, newsletterId),
  });

  const sentCount = deliveries.filter((delivery) =>
    ["sent", "delivered", "opened", "clicked"].includes(delivery.status),
  ).length;
  const failedCount = deliveries.filter((delivery) =>
    ["failed", "bounced", "complained"].includes(delivery.status),
  ).length;
  const openCount = deliveries.filter((delivery) => Boolean(delivery.openedAt)).length;
  const clickCount = deliveries.filter((delivery) => Boolean(delivery.clickedAt)).length;
  const totalRecipients = deliveries.length;

  let status: string = "sending";
  if (totalRecipients === 0) {
    status = "failed";
  } else if (sentCount === totalRecipients && failedCount === 0) {
    status = "sent";
  } else if (sentCount > 0 && failedCount > 0) {
    status = "partial";
  } else if (failedCount === totalRecipients) {
    status = "failed";
  }

  await db
    .update(newsletters)
    .set({
      status,
      totalRecipients,
      sentCount,
      failedCount,
      openCount,
      clickCount,
      sentAt: sentCount > 0 ? new Date() : null,
      sendingCompletedAt:
        status === "sent" || status === "partial" || status === "failed"
          ? new Date()
          : null,
    })
    .where(eq(newsletters.id, newsletterId));
}

async function markCampaignQueued(newsletterId: number, actorUserId?: string | null) {
  const campaign = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  });

  if (!campaign) {
    throw new Error("Newsletter campaign not found");
  }

  await db
    .update(newsletters)
    .set({
      status: "queued",
      queuedAt: new Date(),
      canceledAt: null,
      sendingStartedAt: null,
      sendingCompletedAt: null,
      sentAt: null,
    })
    .where(eq(newsletters.id, newsletterId));

  await logActivity({
    actorUserId: actorUserId ?? null,
    entityType: "newsletter",
    entityId: newsletterId,
    action: "newsletter.queue",
    summary: `Newsletter "${campaign.subject}" queued`,
    metadata: {
      segment: campaign.segment,
    },
  });

  await trackNewsletterEvent(
    actorUserId ?? `newsletter-${newsletterId}`,
    "newsletter_campaign_queued",
    {
      newsletter_id: newsletterId,
      segment: campaign.segment,
    },
  );
}

async function seedCampaignDeliveries(newsletterId: number) {
  const campaign = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  });

  if (!campaign) {
    throw new Error("Newsletter campaign not found");
  }

  const recipients = await listSegmentSubscribers(campaign.segment as NewsletterSegment);
  const deliveryIds: number[] = [];

  for (const recipient of recipients) {
    const existingDelivery = await db.query.newsletterDeliveries.findFirst({
      where: and(
        eq(newsletterDeliveries.newsletterId, newsletterId),
        eq(newsletterDeliveries.subscriberId, recipient.id),
      ),
    });

    if (existingDelivery) {
      deliveryIds.push(existingDelivery.id);
      continue;
    }

    const [delivery] = await db
      .insert(newsletterDeliveries)
      .values({
        newsletterId,
        subscriberId: recipient.id,
        subscriberEmail: recipient.email,
        status: "queued",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: newsletterDeliveries.id });

    deliveryIds.push(delivery.id);
  }

  await db
    .update(newsletters)
    .set({
      status: recipients.length > 0 ? "sending" : "failed",
      totalRecipients: recipients.length,
      sendingStartedAt: new Date(),
    })
    .where(eq(newsletters.id, newsletterId));

  for (const deliveryId of deliveryIds) {
    await enqueueMessage({
      type: "delivery",
      newsletterId,
      deliveryId,
      attempt: 0,
    });
  }

  return { deliveryIds, recipientCount: recipients.length };
}

async function processDeliveryMessage(
  message: Extract<NewsletterQueueMessage, { type: "delivery" }>,
) {
  const delivery = await db.query.newsletterDeliveries.findFirst({
    where: eq(newsletterDeliveries.id, message.deliveryId),
    with: {
      newsletter: true,
      subscriber: true,
    },
  });

  if (!delivery) {
    return;
  }

  if (delivery.newsletter.status === "canceled" || delivery.subscriber.status !== "active") {
    return;
  }

  if (["delivered", "opened", "clicked", "bounced", "complained"].includes(delivery.status)) {
    return;
  }

  const now = new Date();
  const nextAttempt = message.attempt + 1;

  await db
    .update(newsletterDeliveries)
    .set({
      status: "sending",
      attemptCount: nextAttempt,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .where(eq(newsletterDeliveries.id, delivery.id));

  try {
    const settings = await getNewsletterSettings();
    const resendClient = await getResendClient();
    const unsubscribeToken = createNewsletterActionToken({
      purpose: "unsubscribe",
      subscriberId: delivery.subscriber.id,
      email: delivery.subscriber.email,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    const html = buildNewsletterHtml({
      html: delivery.newsletter.content,
      deliveryId: delivery.id,
      unsubscribeToken,
      siteUrl: settings.siteUrl,
      blogName: settings.blogName,
    });

    const result = await resendClient.emails.send({
      from: `${settings.blogName} <${settings.senderEmail}>`,
      to: delivery.subscriber.email,
      subject: delivery.newsletter.subject,
      html,
    });

    await db
      .update(newsletterDeliveries)
      .set({
        status: "sent",
        resendEmailId: result.data?.id ?? delivery.resendEmailId,
        lastError: null,
        sentAt: now,
        updatedAt: now,
      })
      .where(eq(newsletterDeliveries.id, delivery.id));

    await db
      .update(subscribers)
      .set({
        lastEmailSentAt: now,
      })
      .where(eq(subscribers.id, delivery.subscriber.id));

    await db.insert(newsletterLogs).values({
      newsletterId: delivery.newsletter.id,
      subscriberEmail: delivery.subscriber.email,
      status: "sent",
      sentAt: now,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const finalFailure = nextAttempt >= MAX_NEWSLETTER_ATTEMPTS;

    await db
      .update(newsletterDeliveries)
      .set({
        status: finalFailure ? "failed" : "queued",
        lastError: errorMessage,
        failedAt: finalFailure ? now : null,
        updatedAt: now,
      })
      .where(eq(newsletterDeliveries.id, delivery.id));

    await db.insert(newsletterLogs).values({
      newsletterId: delivery.newsletter.id,
      subscriberEmail: delivery.subscriber.email,
      status: "failed",
      error: errorMessage,
      sentAt: now,
    });

    if (finalFailure) {
      await trackNewsletterEvent(`newsletter-${delivery.newsletter.id}`, "newsletter_delivery_failed", {
        newsletter_id: delivery.newsletter.id,
        delivery_id: delivery.id,
        subscriber_email: delivery.subscriber.email,
      });
    } else {
      await enqueueMessage({
        type: "delivery",
        newsletterId: delivery.newsletter.id,
        deliveryId: delivery.id,
        attempt: nextAttempt,
      });
    }

    captureServerException(error, {
      tags: {
        area: "worker",
        flow: "newsletter-delivery",
      },
      extras: {
        newsletterId: delivery.newsletter.id,
        deliveryId: delivery.id,
        subscriberEmail: delivery.subscriber.email,
      },
    });
  }

  await finalizeCampaignStatus(delivery.newsletter.id);
}

export async function processNewsletterQueueMessage(message: NewsletterQueueMessage) {
  if (message.type === "campaign") {
    await seedCampaignDeliveries(message.newsletterId);
    await finalizeCampaignStatus(message.newsletterId);
    return;
  }

  await processDeliveryMessage(message);
}

export async function processNewsletterQueueBatch(messages: NewsletterQueueMessage[]) {
  for (const message of messages) {
    await processNewsletterQueueMessage(message);
  }
}

export async function createNewsletterCampaign(input: {
  subject: string;
  preheader?: string | null;
  content: string;
  postId?: number;
  segment: NewsletterSegment;
}) {
  const [created] = await db
    .insert(newsletters)
    .values({
      subject: input.subject,
      preheader: input.preheader ?? null,
      content: input.content,
      postId: input.postId ?? null,
      segment: input.segment,
      status: "draft",
      createdAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateNewsletterCampaign(input: {
  newsletterId: number;
  subject: string;
  preheader?: string | null;
  content: string;
  postId?: number;
  segment: NewsletterSegment;
}) {
  await db
    .update(newsletters)
    .set({
      subject: input.subject,
      preheader: input.preheader ?? null,
      content: input.content,
      postId: input.postId ?? null,
      segment: input.segment,
    })
    .where(eq(newsletters.id, input.newsletterId));
}

export async function saveNewsletterCampaign(input: {
  newsletterId?: number;
  subject: string;
  preheader?: string | null;
  content: string;
  postId?: number;
  segment: NewsletterSegment;
  action: NewsletterCampaignAction;
  scheduledAt?: Date;
  actorUserId?: string | null;
}) {
  const campaign =
    input.newsletterId === undefined
      ? await createNewsletterCampaign(input)
      : (await updateNewsletterCampaign({
          newsletterId: input.newsletterId,
          subject: input.subject,
          preheader: input.preheader,
          content: input.content,
          postId: input.postId,
          segment: input.segment,
        }),
        await db.query.newsletters.findFirst({
          where: eq(newsletters.id, input.newsletterId),
        }));

  if (!campaign) {
    throw new Error("Newsletter campaign not found");
  }

  if (input.action === "draft") {
    await db
      .update(newsletters)
      .set({
        status: "draft",
        scheduledAt: null,
      })
      .where(eq(newsletters.id, campaign.id));
    return campaign.id;
  }

  if (input.action === "schedule") {
    if (!input.scheduledAt) {
      throw new Error("Scheduled campaigns require a date");
    }

    await db
      .update(newsletters)
      .set({
        status: "scheduled",
        scheduledAt: input.scheduledAt,
      })
      .where(eq(newsletters.id, campaign.id));
    return campaign.id;
  }

  await markCampaignQueued(campaign.id, input.actorUserId ?? null);
  await enqueueMessage({
    type: "campaign",
    newsletterId: campaign.id,
  });
  return campaign.id;
}

export async function queueNewsletterCampaign(newsletterId: number, actorUserId?: string | null) {
  await markCampaignQueued(newsletterId, actorUserId ?? null);
  await enqueueMessage({
    type: "campaign",
    newsletterId,
  });
  return newsletterId;
}

export async function scheduleNewsletterCampaign(
  newsletterId: number,
  scheduledAt: Date,
  actorUserId?: string | null,
) {
  const campaign = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  });

  if (!campaign) {
    throw new Error("Newsletter campaign not found");
  }

  await db
    .update(newsletters)
    .set({
      status: "scheduled",
      scheduledAt,
    })
    .where(eq(newsletters.id, newsletterId));

  await logActivity({
    actorUserId: actorUserId ?? null,
    entityType: "newsletter",
    entityId: newsletterId,
    action: "newsletter.schedule",
    summary: `Newsletter "${campaign.subject}" scheduled`,
    metadata: {
      scheduledAt: scheduledAt.toISOString(),
    },
  });

  return newsletterId;
}

export async function cancelNewsletterCampaign(newsletterId: number, actorUserId?: string | null) {
  const campaign = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  });

  if (!campaign) {
    throw new Error("Newsletter campaign not found");
  }

  await db
    .update(newsletters)
    .set({
      status: "canceled",
      canceledAt: new Date(),
    })
    .where(eq(newsletters.id, newsletterId));

  await logActivity({
    actorUserId: actorUserId ?? null,
    entityType: "newsletter",
    entityId: newsletterId,
    action: "newsletter.cancel",
    summary: `Newsletter "${campaign.subject}" canceled`,
  });
}

export async function getNewsletterCampaignById(newsletterId: number) {
  return db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
    with: {
      post: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function listNewsletterDeliveries(newsletterId: number) {
  return db.query.newsletterDeliveries.findMany({
    where: eq(newsletterDeliveries.newsletterId, newsletterId),
    with: {
      subscriber: true,
    },
    orderBy: [desc(newsletterDeliveries.updatedAt)],
  });
}

export async function enqueueDueNewsletterCampaigns(now = new Date()) {
  const dueCampaigns = await db.query.newsletters.findMany({
    where: and(eq(newsletters.status, "scheduled"), lte(newsletters.scheduledAt, now)),
  });

  for (const campaign of dueCampaigns) {
    await markCampaignQueued(campaign.id, null);
    await enqueueMessage({
      type: "campaign",
      newsletterId: campaign.id,
    });
  }

  return dueCampaigns.length;
}

async function sendDoubleOptInEmail(subscriber: typeof subscribers.$inferSelect) {
  const settings = await getNewsletterSettings();
  const resendClient = await getResendClient();
  const token = createNewsletterActionToken({
    purpose: "confirm",
    subscriberId: subscriber.id,
    email: subscriber.email,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });
  const confirmUrl = `${settings.siteUrl}${withSearchParams("/api/newsletter/confirm", {
    token,
  })}`;

  await resendClient.emails.send({
    from: `${settings.blogName} <${settings.senderEmail}>`,
    to: subscriber.email,
    subject: `Confirm your ${settings.blogName} newsletter subscription`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>Confirm your subscription</h2>
        <p>Please confirm your email address to receive future newsletter issues.</p>
        <p><a href="${confirmUrl}">Confirm subscription</a></p>
      </div>
    `,
  });
}

export async function subscribeNewsletterAddress(input: {
  email: string;
  source?: string | null;
  requestMetadata?: Pick<SecurityRequestMetadata, "ipHash" | "userAgentShort"> | null;
}) {
  const email = input.email.toLowerCase();
  const settings = await getNewsletterSettings();
  const now = new Date();
  const desiredStatus = settings.doubleOptInEnabled ? "pending" : "active";

  const existing = await db.query.subscribers.findFirst({
    where: eq(subscribers.email, email),
  });

  if (existing) {
    await db
      .update(subscribers)
      .set({
        status: desiredStatus,
        source: input.source ?? existing.source,
        unsubscribedAt: null,
        confirmedAt: desiredStatus === "active" ? existing.confirmedAt ?? now : null,
      })
      .where(eq(subscribers.id, existing.id));

    await createSubscriberEvent(existing.id, "subscribe", {
      source: input.source ?? null,
      reused: true,
      status: desiredStatus,
    });
    await recordNewsletterConsent({
      subscriberId: existing.id,
      email,
      source: input.source ?? null,
      status: "subscribed",
      requestMetadata: input.requestMetadata,
    });

    if (desiredStatus === "pending") {
      await sendDoubleOptInEmail({ ...existing, status: desiredStatus });
      return {
        success: true,
        state: "pending_confirmation" as const,
        message: "Check your inbox to confirm your subscription.",
      };
    }

    await trackNewsletterEvent(email, "newsletter_subscribed", {
      email,
      source: input.source ?? null,
    });
    return {
      success: true,
      state: "active" as const,
      message:
        existing.status === "active"
          ? "You're already subscribed!"
          : "Thanks for joining the newsletter!",
    };
  }

  const [created] = await db
    .insert(subscribers)
    .values({
      email,
      status: desiredStatus,
      source: input.source ?? null,
      confirmedAt: desiredStatus === "active" ? now : null,
      createdAt: now,
    })
    .returning();

  await createSubscriberEvent(created.id, "subscribe", {
    source: input.source ?? null,
    status: desiredStatus,
  });
  await recordNewsletterConsent({
    subscriberId: created.id,
    email,
    source: input.source ?? null,
    status: "subscribed",
    requestMetadata: input.requestMetadata,
  });

  if (desiredStatus === "pending") {
    await sendDoubleOptInEmail(created);
    return {
      success: true,
      state: "pending_confirmation" as const,
      message: "Check your inbox to confirm your subscription.",
    };
  }

  await trackNewsletterEvent(email, "newsletter_subscribed", {
    email,
    source: input.source ?? null,
  });
  return {
    success: true,
    state: "active" as const,
    message: "Thanks for joining the tribe!",
  };
}

export async function confirmNewsletterSubscriptionToken(token: string) {
  const parsed = decodeToken(token);
  if (parsed.purpose !== "confirm") {
    throw new Error("Invalid confirmation token");
  }

  const subscriberId = Number(parsed.subscriberId);
  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.id, subscriberId),
  });

  if (!subscriber || subscriber.email !== parsed.email) {
    throw new Error("Subscriber not found");
  }

  const now = new Date();
  await db
    .update(subscribers)
    .set({
      status: "active",
      confirmedAt: now,
      unsubscribedAt: null,
    })
    .where(eq(subscribers.id, subscriberId));

  await createSubscriberEvent(subscriberId, "confirm", {
    email: subscriber.email,
  });
  await recordNewsletterConsent({
    subscriberId,
    email: subscriber.email,
    source: subscriber.source ?? null,
    status: "confirmed",
  });
  await trackNewsletterEvent(subscriber.email, "newsletter_confirmed", {
    subscriber_id: subscriberId,
  });

  return subscriber;
}

export async function unsubscribeNewsletterToken(token: string) {
  const parsed = decodeToken(token);
  if (parsed.purpose !== "unsubscribe") {
    throw new Error("Invalid unsubscribe token");
  }

  const subscriberId = Number(parsed.subscriberId);
  const subscriber = await db.query.subscribers.findFirst({
    where: eq(subscribers.id, subscriberId),
  });

  if (!subscriber || subscriber.email !== parsed.email) {
    throw new Error("Subscriber not found");
  }

  const now = new Date();
  await db
    .update(subscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: now,
    })
    .where(eq(subscribers.id, subscriberId));

  await createSubscriberEvent(subscriberId, "unsubscribe", {
    email: subscriber.email,
  });
  await recordNewsletterConsent({
    subscriberId,
    email: subscriber.email,
    source: subscriber.source ?? null,
    status: "unsubscribed",
  });
  await trackNewsletterEvent(subscriber.email, "newsletter_unsubscribed", {
    subscriber_id: subscriberId,
  });

  return subscriber;
}

export async function recordNewsletterOpen(deliveryId: number) {
  const delivery = await db.query.newsletterDeliveries.findFirst({
    where: eq(newsletterDeliveries.id, deliveryId),
  });

  if (!delivery || delivery.openedAt) {
    return;
  }

  const now = new Date();
  await db
    .update(newsletterDeliveries)
    .set({
      status: delivery.clickedAt ? "clicked" : "opened",
      openedAt: now,
      updatedAt: now,
    })
    .where(eq(newsletterDeliveries.id, deliveryId));

  await db
    .update(subscribers)
    .set({
      lastOpenedAt: now,
    })
    .where(eq(subscribers.id, delivery.subscriberId));

  await finalizeCampaignStatus(delivery.newsletterId);
  await trackNewsletterEvent(`delivery-${deliveryId}`, "newsletter_opened", {
    newsletter_id: delivery.newsletterId,
    delivery_id: deliveryId,
  });
}

export async function recordNewsletterClick(deliveryId: number, url: string) {
  const delivery = await db.query.newsletterDeliveries.findFirst({
    where: eq(newsletterDeliveries.id, deliveryId),
  });

  if (!delivery) {
    return;
  }

  const now = new Date();
  await db
    .update(newsletterDeliveries)
    .set({
      status: "clicked",
      clickedAt: delivery.clickedAt ?? now,
      openedAt: delivery.openedAt ?? now,
      updatedAt: now,
    })
    .where(eq(newsletterDeliveries.id, deliveryId));

  await db
    .update(subscribers)
    .set({
      lastClickedAt: now,
      lastOpenedAt: delivery.openedAt ?? now,
    })
    .where(eq(subscribers.id, delivery.subscriberId));

  await finalizeCampaignStatus(delivery.newsletterId);
  await trackNewsletterEvent(`delivery-${deliveryId}`, "newsletter_clicked", {
    newsletter_id: delivery.newsletterId,
    delivery_id: deliveryId,
    url,
  });
}

export function getOpenPixelResponse() {
  return new Response(Buffer.from(OPEN_PIXEL, "base64"), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function processResendWebhook(payload: ResendWebhookPayload) {
  const emailId = payload.data?.email_id;
  if (!emailId) {
    return { duplicate: false, processed: false };
  }

  const delivery = await db.query.newsletterDeliveries.findFirst({
    where: eq(newsletterDeliveries.resendEmailId, emailId),
  });

  if (!delivery) {
    return { duplicate: false, processed: false };
  }

  const eventId = `${payload.type}:${emailId}:${payload.created_at ?? ""}`;
  if (delivery.lastEventId === eventId) {
    return { duplicate: true, processed: false };
  }

  const now = new Date(payload.created_at ?? Date.now());
  const update: Partial<typeof newsletterDeliveries.$inferInsert> = {
    lastEventId: eventId,
    updatedAt: now,
  };

  if (payload.type === "email.delivered") {
    update.status = "delivered";
    update.deliveredAt = now;
  }
  if (payload.type === "email.bounced") {
    update.status = "bounced";
    update.bouncedAt = now;
  }
  if (payload.type === "email.complained") {
    update.status = "complained";
    update.complainedAt = now;
  }
  if (payload.type === "email.opened") {
    update.status = delivery.clickedAt ? "clicked" : "opened";
    update.openedAt = delivery.openedAt ?? now;
  }
  if (payload.type === "email.clicked") {
    update.status = "clicked";
    update.clickedAt = delivery.clickedAt ?? now;
    update.openedAt = delivery.openedAt ?? now;
  }

  await db.update(newsletterDeliveries).set(update).where(eq(newsletterDeliveries.id, delivery.id));

  if (payload.type === "email.bounced") {
    await db.update(subscribers).set({ status: "bounced" }).where(eq(subscribers.id, delivery.subscriberId));
    await createSubscriberEvent(delivery.subscriberId, "bounce", { emailId });
  }
  if (payload.type === "email.complained") {
    await db.update(subscribers).set({ status: "complained" }).where(eq(subscribers.id, delivery.subscriberId));
    await createSubscriberEvent(delivery.subscriberId, "complaint", { emailId });
  }

  await finalizeCampaignStatus(delivery.newsletterId);
  return { duplicate: false, processed: true };
}
