import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "#/server/db/index";
import { comments, posts } from "#/server/db/schema";
import { requireCommentModerationAccess } from "#/server/editorial/access";
import { logActivity } from "#/server/activity-log";
import {
  bulkCommentActionSchema,
  commentStatusUpdateSchema,
  recordIdSchema,
} from "#/schemas";

export const getDashboardComments = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireCommentModerationAccess();
    return await db
      .select({
        id: comments.id,
        authorName: comments.authorName,
        authorEmail: comments.authorEmail,
        content: comments.content,
        status: comments.status,
        createdAt: comments.createdAt,
        postTitle: posts.title,
        postId: posts.id,
      })
      .from(comments)
      .leftJoin(posts, eq(comments.postId, posts.id))
      .orderBy(desc(comments.createdAt));
  },
);

export const updateDashboardCommentStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => commentStatusUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireCommentModerationAccess();
    await db
      .update(comments)
      .set({ status: data.status })
      .where(eq(comments.id, data.id));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "comment",
      entityId: data.id,
      action: "comment.status_update",
      summary: `Comment ${data.id} moved to ${data.status}`,
      metadata: {
        status: data.status,
      },
    });

    return { success: true as const };
  });

export const deleteDashboardComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse({ id: input }))
  .handler(async ({ data }) => {
    const session = await requireCommentModerationAccess();
    await db.delete(comments).where(eq(comments.id, data.id));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "comment",
      entityId: data.id,
      action: "comment.delete",
      summary: `Comment ${data.id} deleted`,
    });

    return { success: true as const };
  });

export const bulkModerateDashboardComments = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bulkCommentActionSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireCommentModerationAccess();

    if (data.action === "delete") {
      await db
        .delete(comments)
        .where(inArray(comments.id, data.ids));

      await logActivity({
        actorUserId: session.user.id,
        entityType: "comment",
        entityId: data.ids.join(","),
        action: "comment.bulk_delete",
        summary: `${data.ids.length} comments deleted in bulk`,
        metadata: {
          ids: data.ids,
        },
      });

      return { success: true as const };
    }

    const nextStatus =
      data.action === "approve"
        ? "approved"
        : data.action === "spam"
          ? "spam"
          : "pending";

    await db
      .update(comments)
      .set({ status: nextStatus })
      .where(inArray(comments.id, data.ids));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "comment",
      entityId: data.ids.join(","),
      action: "comment.bulk_status_update",
      summary: `${data.ids.length} comments moved to ${nextStatus}`,
      metadata: {
        ids: data.ids,
        status: nextStatus,
      },
    });

    return { success: true as const };
  });

