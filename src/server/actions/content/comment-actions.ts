import { db } from "#/db/index";
import { comments, posts } from "#/db/schema";
import { eq } from "drizzle-orm";
import { publicCommentSchema } from "#/schemas/editorial";
import { evaluateCommentSpam } from "#/server/security/comments";
import { logSecurityEvent } from "#/server/security/events";
import { logOperationalEvent } from "#/server/system/operations";
import type { z } from "zod";

export type CreatePendingCommentInput = z.output<typeof publicCommentSchema> & {
  sourceIpHash?: string | null;
  userAgent?: string | null;
};

export async function createPendingComment(input: CreatePendingCommentInput) {
  const data = publicCommentSchema.parse(input);

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, data.postId),
    columns: {
      id: true,
      commentsEnabled: true,
    },
  });

  if (!post) {
    logOperationalEvent("comment-create-failed", {
      actor: input.sourceIpHash ?? null,
      entity: "comment",
      outcome: "failure",
      reason: "post_not_found",
      postId: data.postId,
    }, "warn");
    throw new Error("Post not found");
  }

  if (post.commentsEnabled === false) {
    logOperationalEvent("comment-create-failed", {
      actor: input.sourceIpHash ?? null,
      entity: "comment",
      outcome: "failure",
      reason: "comments_disabled",
      postId: data.postId,
    }, "warn");
    throw new Error("Comments are disabled for this post");
  }

  const spamCheck = await evaluateCommentSpam({
    postId: data.postId,
    authorEmail: data.authorEmail ?? null,
    content: data.content,
    sourceIpHash: input.sourceIpHash ?? null,
  });

  if (spamCheck.decision === "blocked") {
    await logSecurityEvent({
      type: "comment.blocked",
      scope: "comment.create",
      ipHash: input.sourceIpHash ?? null,
      userAgent: input.userAgent ?? null,
      metadata: {
        reason: spamCheck.reason,
        postId: data.postId,
        authorEmail: data.authorEmail ?? null,
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    logOperationalEvent("comment-blocked", {
      actor: input.sourceIpHash ?? null,
      entity: "comment",
      outcome: "failure",
      reason: spamCheck.reason,
      postId: data.postId,
    }, "warn");
    throw new Error("Your comment looks suspicious and was blocked.");
  }

  const [created] = await db
    .insert(comments)
    .values({
      postId: data.postId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || null,
      sourceIpHash: input.sourceIpHash ?? null,
      userAgent: input.userAgent ?? null,
      spamReason: spamCheck.reason,
      content: data.content,
      status: spamCheck.decision === "spam" ? "spam" : "pending",
    })
    .returning();

  if (spamCheck.decision === "spam") {
    await logSecurityEvent({
      type: "comment.spam",
      scope: "comment.create",
      ipHash: input.sourceIpHash ?? null,
      userAgent: input.userAgent ?? null,
      metadata: {
        reason: spamCheck.reason,
        postId: data.postId,
        commentId: created.id,
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    logOperationalEvent("comment-flagged-spam", {
      actor: input.sourceIpHash ?? null,
      entity: "comment",
      outcome: "warning",
      reason: spamCheck.reason,
      postId: data.postId,
      commentId: created.id,
    }, "warn");
  }

  logOperationalEvent("comment-created", {
    actor: input.sourceIpHash ?? null,
    entity: "comment",
    outcome: spamCheck.decision === "pending" ? "success" : "warning",
    postId: data.postId,
    commentId: created.id,
    status: created.status,
  });

  return created;
}
