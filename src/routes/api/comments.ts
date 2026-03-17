import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import { publicCommentSubmissionSchema } from "#/schemas";
import { getAuthSession } from "#/server/auth/session";
import { createPendingComment } from "#/server/actions/content/comment-actions";
import { captureServerException } from "#/server/sentry";
import { enforceRateLimit } from "#/server/security/rate-limit";
import { getSecurityRequestMetadata } from "#/server/security/request";
import { verifyTurnstileToken } from "#/server/integrations/turnstile";
import { logSecurityEvent } from "#/server/security/events";
import { logOperationalEvent } from "#/server/system/operations";

export const Route = createFileRoute("/api/comments")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const session = await getAuthSession();
          const metadata = getSecurityRequestMetadata(request);

          const parsed = publicCommentSubmissionSchema.parse({
            postId: Number(body?.postId),
            authorName: session?.user?.name || body?.authorName,
            authorEmail: session?.user?.email || body?.authorEmail,
            content: body?.content,
            turnstileToken: body?.turnstileToken,
          });

          const decision = await enforceRateLimit({
            scope: "comment.create",
            request,
            keyParts: [parsed.authorEmail?.toLowerCase() ?? null],
            limit: 5,
            windowMs: 10 * 60 * 1000,
          });

          if (!decision.allowed) {
            logOperationalEvent("comments-rate-limit-hit", {
              postId: parsed.postId,
              email: parsed.authorEmail?.toLowerCase() ?? null,
            }, "warn");
            return new Response("Too many comments. Please try again later.", {
              status: 429,
            });
          }

          const verification = await verifyTurnstileToken({
            token: parsed.turnstileToken,
            ip: metadata.ip,
          });

          if (!verification.success) {
            await logSecurityEvent({
              type: "turnstile.failed",
              scope: "comment.create",
              ipHash: metadata.ipHash,
              userAgent: metadata.userAgentShort,
              metadata: {
                errors: verification.errors ?? [],
                email: parsed.authorEmail?.toLowerCase() ?? null,
              },
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            return new Response("Security verification failed. Please try again.", {
              status: 403,
            });
          }

          const newComment = await createPendingComment({
            ...parsed,
            sourceIpHash: metadata.ipHash,
            userAgent: metadata.userAgentShort,
          });
          logOperationalEvent("comment-created", {
            postId: newComment.postId,
            commentId: newComment.id,
            status: newComment.status,
          });

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
          logOperationalEvent("comment-create-failed", {
            requestUrl: request.url,
          }, "error");
          const message = error instanceof Error ? error.message : "Internal Server Error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});

