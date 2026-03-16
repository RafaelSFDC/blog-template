import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { newsletters, subscribers } from "#/db/schema";
import {
  newsletterCampaignActionSchema,
  newsletterCampaignSchema,
  newsletterSubscribeSubmissionSchema,
  positiveIntSchema,
  recordIdSchema,
} from "#/schemas";
import { requireAdminSession } from "#/server/auth/session";
import {
  cancelNewsletterCampaign,
  confirmNewsletterSubscriptionToken,
  getNewsletterCampaignById,
  listNewsletterDeliveries,
  queueNewsletterCampaign,
  scheduleNewsletterCampaign,
  saveNewsletterCampaign,
  subscribeNewsletterAddress,
  unsubscribeNewsletterToken,
} from "#/server/newsletter-campaigns";
import { captureServerException } from "#/server/sentry";
import { enforceRateLimit } from "#/server/security/rate-limit";
import { getSecurityRequestMetadata } from "#/server/security/request";
import { verifyTurnstileToken } from "#/server/integrations/turnstile";
import { logSecurityEvent } from "#/server/security/events";

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => newsletterSubscribeSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const request = getRequest();
      if (!request) {
        throw new Error("Request context unavailable");
      }

      const decision = await enforceRateLimit({
        scope: "newsletter.subscribe",
        request,
        keyParts: [data.email.toLowerCase()],
        limit: 6,
        windowMs: 15 * 60 * 1000,
      });

      if (!decision.allowed) {
        return {
          success: false,
          state: "error" as const,
          message: "Too many subscription attempts. Please try again later.",
        };
      }

      const metadata = getSecurityRequestMetadata(request);
      const verification = await verifyTurnstileToken({
        token: data.turnstileToken,
        ip: metadata.ip,
      });

      if (!verification.success) {
        await logSecurityEvent({
          type: "turnstile.failed",
          scope: "newsletter.subscribe",
          ipHash: metadata.ipHash,
          userAgent: metadata.userAgentShort,
          metadata: {
            email: data.email.toLowerCase(),
            errors: verification.errors ?? [],
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        return {
          success: false,
          state: "error" as const,
          message: "Security verification failed. Please try again.",
        };
      }

      return await subscribeNewsletterAddress({
        email: data.email,
        source: data.source ?? "site_form",
        requestMetadata: metadata,
      });
    } catch (error) {
      captureServerException(error, {
        tags: {
          area: "server",
          flow: "newsletter-subscribe",
        },
        extras: {
          email: data.email,
        },
      });
      return {
        success: false,
        state: "error" as const,
        message: "Subscription failed. Try again later.",
      };
    }
  });

export const confirmNewsletterSubscription = createServerFn({ method: "POST" })
  .inputValidator((token: string) => token)
  .handler(async ({ data }) => {
    return confirmNewsletterSubscriptionToken(data);
  });

export const unsubscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((token: string) => token)
  .handler(async ({ data }) => {
    return unsubscribeNewsletterToken(data);
  });

export const createNewsletterCampaignAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    newsletterCampaignSchema.extend({
      action: newsletterCampaignActionSchema.shape.action,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    const newsletterId = await saveNewsletterCampaign({
      subject: data.subject,
      preheader: data.preheader ?? null,
      content: data.content,
      postId: data.postId,
      segment: data.segment,
      action: data.action,
      scheduledAt: data.scheduledAt,
      actorUserId: session.user.id,
    });

    return { id: newsletterId };
  });

export const updateNewsletterCampaignAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    newsletterCampaignSchema.extend({
      newsletterId: positiveIntSchema,
      action: newsletterCampaignActionSchema.shape.action,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    const newsletterId = await saveNewsletterCampaign({
      newsletterId: data.newsletterId,
      subject: data.subject,
      preheader: data.preheader ?? null,
      content: data.content,
      postId: data.postId,
      segment: data.segment,
      action: data.action,
      scheduledAt: data.scheduledAt,
      actorUserId: session.user.id,
    });

    return { id: newsletterId };
  });

export const cancelNewsletterCampaignAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await cancelNewsletterCampaign(data.id, session.user.id);
    return { success: true };
  });

export const scheduleNewsletterCampaignAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => newsletterCampaignActionSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    if (!data.scheduledAt) {
      throw new Error("Scheduled campaigns require a date");
    }
    await scheduleNewsletterCampaign(data.newsletterId, data.scheduledAt, session.user.id);
    return { success: true };
  });

export const queueNewsletterCampaignAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    await queueNewsletterCampaign(data.id, session.user.id);
    return { success: true };
  });

export const getNewsletterCampaignAction = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    await requireAdminSession();
    return getNewsletterCampaignById(data);
  });

export const listNewsletterDeliveriesAction = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    await requireAdminSession();
    return listNewsletterDeliveries(data);
  });

export const getNewsletterIndexData = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();

  const [campaigns, subscriberRows] = await Promise.all([
    db.query.newsletters.findMany({
      with: {
        post: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [desc(newsletters.createdAt)],
    }),
    db.query.subscribers.findMany({
      orderBy: [desc(subscribers.createdAt)],
    }),
  ]);

  const activeCount = subscriberRows.filter((row) => row.status === "active").length;
  const sentCampaigns = campaigns.filter((row) => row.status === "sent").length;
  const averageOpenRate =
    campaigns.length === 0
      ? 0
      : campaigns.reduce((sum, row) => sum + (row.totalRecipients > 0 ? row.openCount / row.totalRecipients : 0), 0) /
        campaigns.length;
  const averageClickRate =
    campaigns.length === 0
      ? 0
      : campaigns.reduce((sum, row) => sum + (row.totalRecipients > 0 ? row.clickCount / row.totalRecipients : 0), 0) /
        campaigns.length;

  return {
    campaigns,
    stats: {
      activeSubscribers: activeCount,
      sentCampaigns,
      averageOpenRate,
      averageClickRate,
    },
  };
});

export const exportSubscribersCsv = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();

  const rows = await db.query.subscribers.findMany({
    orderBy: [desc(subscribers.createdAt)],
  });

  const header = [
    "Email",
    "Status",
    "Source",
    "ConfirmedAt",
    "UnsubscribedAt",
    "CreatedAt",
  ].join(",");

  const body = rows
    .map((row) =>
      [
        row.email,
        row.status,
        row.source ?? "",
        row.confirmedAt instanceof Date ? row.confirmedAt.toISOString() : row.confirmedAt ?? "",
        row.unsubscribedAt instanceof Date ? row.unsubscribedAt.toISOString() : row.unsubscribedAt ?? "",
        row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  return `${header}\n${body}`;
});

export const deleteNewsletterCampaignAction = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db.delete(newsletters).where(eq(newsletters.id, data));
    return { success: true };
  });
