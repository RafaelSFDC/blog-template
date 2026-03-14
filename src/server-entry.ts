import * as Sentry from "@sentry/cloudflare";
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { publishScheduledPosts } from "#/server/post-actions";
import {
  captureServerException,
  getWorkerSentryOptions,
} from "#/server/sentry";

const fetch = createStartHandler(defaultStreamHandler);

async function runScheduledPublish() {
  try {
    const result = await publishScheduledPosts(new Date());

    console.log(
      JSON.stringify({
        event: "scheduled-post-publish",
        count: result.count,
        publishedIds: result.publishedIds,
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
