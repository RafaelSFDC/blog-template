import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { publishScheduledPosts } from "#/server/post-actions";

const fetch = createStartHandler(defaultStreamHandler);

async function runScheduledPublish() {
  const result = await publishScheduledPosts(new Date());

  console.log(
    JSON.stringify({
      event: "scheduled-post-publish",
      count: result.count,
      publishedIds: result.publishedIds,
    }),
  );
}

export default {
  fetch,
  scheduled(_controller: ScheduledController, _env: unknown, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledPublish());
  },
};
