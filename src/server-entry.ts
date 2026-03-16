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
import { publishScheduledPosts } from "#/server/post-actions";
import { cleanupExpiredRateLimitEvents } from "#/server/security/rate-limit";
import {
  captureServerException,
  getWorkerSentryOptions,
} from "#/server/sentry";

const fetch = createStartHandler(defaultStreamHandler);

async function runScheduledPublish() {
  try {
    const [postResult, queuedCampaigns, rateLimitCleanup] = await Promise.all([
      publishScheduledPosts(new Date()),
      enqueueDueNewsletterCampaigns(new Date()),
      cleanupExpiredRateLimitEvents(),
    ]);

    console.log(
      JSON.stringify({
        event: "scheduled-editorial-jobs",
        publishedCount: postResult.count,
        publishedIds: postResult.publishedIds,
        queuedCampaigns,
        cleanedRateLimitEvents: rateLimitCleanup,
      }),
    );
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

const workerFetch =
  fetch as unknown as ExportedHandlerFetchHandler<WorkerEnv, unknown>;

const handler = {
  fetch: workerFetch,
  async queue(batch: MessageBatch<NewsletterQueueMessage>) {
    await processNewsletterQueueBatch(batch.messages.map((message) => message.body));
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
