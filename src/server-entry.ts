import * as Sentry from "@sentry/cloudflare";
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import {
  enqueueDueNewsletterCampaigns,
  processNewsletterQueueBatch,
  type NewsletterQueueMessage,
} from "#/server/newsletter-campaigns";
import { publishScheduledPosts } from "#/server/actions/post-actions";
import { cleanupExpiredRateLimitEvents } from "#/server/security/rate-limit";
import {
  captureServerException,
  getWorkerSentryOptions,
} from "#/server/sentry";
import { logOperationalEvent } from "#/server/system/operations";

const fetch = createStartHandler(defaultStreamHandler);

async function runScheduledPublish() {
  try {
    const [postResult, queuedCampaigns, rateLimitCleanup] = await Promise.all([
      publishScheduledPosts(new Date()),
      enqueueDueNewsletterCampaigns(new Date()),
      cleanupExpiredRateLimitEvents(),
    ]);

    logOperationalEvent("scheduled-editorial-jobs", {
      publishedCount: postResult.count,
      publishedIds: postResult.publishedIds,
      queuedCampaigns,
      cleanedRateLimitEvents: rateLimitCleanup,
    });
  } catch (error) {
    captureServerException(error, {
      tags: {
        area: "worker",
        flow: "scheduled-post-publish",
      },
    });
    throw error;
  }
}

type WorkerEnv = {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_RELEASE?: string;
};

const workerFetch = fetch as ExportedHandlerFetchHandler<WorkerEnv, unknown>;

function isNewsletterQueueMessage(value: unknown): value is NewsletterQueueMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.type === "campaign") {
    return typeof candidate.newsletterId === "number";
  }

  if (candidate.type === "delivery") {
    return (
      typeof candidate.newsletterId === "number" &&
      typeof candidate.deliveryId === "number" &&
      typeof candidate.attempt === "number"
    );
  }

  return false;
}

const handler = {
  fetch: workerFetch,
  async queue(batch: MessageBatch<unknown>) {
    logOperationalEvent("newsletter-queue-batch-started", {
      size: batch.messages.length,
    });
    const messages = batch.messages
      .map((message) => message.body)
      .filter(isNewsletterQueueMessage);
    await processNewsletterQueueBatch(messages);
    logOperationalEvent("newsletter-queue-batch-finished", {
      size: messages.length,
    });
  },
  scheduled(
    _controller: ScheduledController,
    _env: WorkerEnv,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      Sentry.withMonitor("scheduled-post-publish", () => runScheduledPublish()),
    );
  },
} satisfies ExportedHandler<WorkerEnv>;

export default Sentry.withSentry(
  (env: WorkerEnv) => getWorkerSentryOptions(env),
  handler,
);

