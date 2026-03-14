import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { publicCommentSchema } from "#/lib/cms-schema";
import { getAuthSession } from "#/lib/admin-auth";
import { createPendingComment } from "#/server/comment-actions";
import { captureServerException } from "#/server/sentry";

export const Route = createFileRoute("/api/comments")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const session = await getAuthSession();

          const parsed = publicCommentSchema.parse({
            postId: Number(body?.postId),
            authorName: session?.user?.name || body?.authorName,
            authorEmail: session?.user?.email || body?.authorEmail,
            content: body?.content,
          });

          const newComment = await createPendingComment(parsed);

          return Response.json(newComment);
        } catch (error: unknown) {
          if (error instanceof ZodError) {
            return new Response(error.issues[0]?.message || "Invalid comment payload", {
              status: 400,
            });
          }

          if (error instanceof Error && error.message === "Post not found") {
            return new Response("Post not found", { status: 404 });
          }

          captureServerException(error, {
            tags: {
              area: "api",
              flow: "comments-create",
            },
            extras: {
              requestUrl: request.url,
            },
          });
          console.error("Error creating comment:", error);
          const message = error instanceof Error ? error.message : "Internal Server Error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});

