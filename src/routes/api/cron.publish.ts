import { createFileRoute } from "@tanstack/react-router";
import { getBinding } from "#/lib/cf-env";
import { publishScheduledPosts } from "#/server/post-actions";
import {
  getCronSecretConfig,
  isAuthorizedCronRequest,
} from "#/server/post-domain";

export const Route = createFileRoute("/api/cron/publish")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const secret = url.searchParams.get("secret");
        const secretConfig = getCronSecretConfig(
          getBinding<string>("CRON_SECRET") || process.env.CRON_SECRET,
        );

        if (secretConfig.required && !secretConfig.secret) {
          return new Response("CRON_SECRET is required in production", { status: 500 });
        }

        if (!isAuthorizedCronRequest(secret, secretConfig)) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const result = await publishScheduledPosts(new Date());
          if (result.count === 0) {
            return Response.json({ message: "No posts to publish", count: 0 });
          }

          return Response.json({
            message: "Successfully published posts",
            count: result.count,
            publishedIds: result.publishedIds,
          });
        } catch (error: unknown) {
          console.error("Error in cron publish:", error);
          const message = error instanceof Error ? error.message : "Internal Server Error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
