import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { comments, posts } from "#/db/schema";
import { requireCommentModerationAccess } from "#/server/editorial/access";
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
    await requireCommentModerationAccess();
    await db
      .update(comments)
      .set({ status: data.status })
      .where(eq(comments.id, data.id));
    return { success: true as const };
  });

export const deleteDashboardComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse({ id: input }))
  .handler(async ({ data }) => {
    await requireCommentModerationAccess();
    await db.delete(comments).where(eq(comments.id, data.id));
    return { success: true as const };
  });

export const bulkModerateDashboardComments = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bulkCommentActionSchema.parse(input))
  .handler(async ({ data }) => {
    await requireCommentModerationAccess();

    if (data.action === "delete") {
      await db
        .delete(comments)
        .where((commentsTable, { inArray }) => inArray(commentsTable.id, data.ids));
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
      .where((commentsTable, { inArray }) => inArray(commentsTable.id, data.ids));

    return { success: true as const };
  });
