import { describe, expect, it, vi } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

vi.mock("#/server/editorial/access", () => ({
  requireCommentModerationAccess: vi.fn().mockResolvedValue({
    user: {
      id: "moderator-user",
      role: "moderator",
    },
  }),
}));

describe("comment moderation audit integration", () => {
  it("writes activity logs for status changes and deletions", async () => {
    await withIsolatedDatabase("comment-moderation-audit", async () => {
      const { db } = await import("#/db/index");
      const { activityLogs, comments, posts, user } = await import("#/db/schema");
      const {
        bulkModerateDashboardComments,
        deleteDashboardComment,
        updateDashboardCommentStatus,
      } = await import("#/server/dashboard/comments");

      await db.insert(user).values({
        id: "moderator-user",
        name: "Moderator User",
        email: "moderator@lumina.test",
        emailVerified: true,
        role: "moderator",
      });

      const [post] = await db
        .insert(posts)
        .values({
          slug: "moderation-post",
          title: "Moderation Post",
          excerpt: "excerpt",
          content: "content",
          status: "published",
          publishedAt: new Date(),
        })
        .returning();

      const insertedComments = await db
        .insert(comments)
        .values([
          {
            postId: post.id,
            authorName: "Reader One",
            authorEmail: "reader1@lumina.test",
            content: "comment one",
            status: "pending",
          },
          {
            postId: post.id,
            authorName: "Reader Two",
            authorEmail: "reader2@lumina.test",
            content: "comment two",
            status: "pending",
          },
        ])
        .returning();

      await updateDashboardCommentStatus({
        data: {
          id: insertedComments[0].id,
          status: "approved",
        },
      });

      await bulkModerateDashboardComments({
        data: {
          ids: [insertedComments[1].id],
          action: "spam",
        },
      });

      await deleteDashboardComment({ data: { id: insertedComments[0].id } });

      const audit = await db.select().from(activityLogs);
      const actions = audit.map((entry) => entry.action);

      expect(actions).toContain("comment.status_update");
      expect(actions).toContain("comment.bulk_status_update");
      expect(actions).toContain("comment.delete");
    });
  }, 15000);
});
