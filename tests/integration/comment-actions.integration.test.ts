import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

describe("comment-actions integration", () => {
  beforeEach(() => {
    Reflect.deleteProperty(process.env, "ENVIRONMENT");
  });

  it("blocks comments when the post disables discussion", async () => {
    await withIsolatedDatabase("comments-disabled", async () => {
      const { db } = await import("#/server/db/index");
      const { posts } = await import("#/server/db/schema");
      const { createPendingComment } = await import("#/server/actions/comment-actions");

      const [post] = await db
        .insert(posts)
        .values({
          slug: "comments-disabled-post",
          title: "Comments disabled",
          excerpt: "Comments disabled excerpt",
          content: "Comments disabled body",
          status: "published",
          commentsEnabled: false,
          updatedAt: new Date(),
        })
        .returning();

      await expect(
        createPendingComment({
          postId: post.id,
          authorName: "Reader",
          authorEmail: "reader@example.com",
          content: "Great post!",
        }),
      ).rejects.toThrow("Comments are disabled for this post");
    });
  }, 15000);

  it("marks suspicious comments as spam and stores the spam reason", async () => {
    await withIsolatedDatabase("comments-spam", async () => {
      const { db } = await import("#/server/db/index");
      const { comments, posts } = await import("#/server/db/schema");
      const { createPendingComment } = await import("#/server/actions/comment-actions");

      const [post] = await db
        .insert(posts)
        .values({
          slug: "comments-spam-post",
          title: "Spam analysis",
          excerpt: "Spam excerpt",
          content: "Spam body",
          status: "published",
          commentsEnabled: true,
          updatedAt: new Date(),
        })
        .returning();

      const created = await createPendingComment({
        postId: post.id,
        authorName: "Spammer",
        authorEmail: "spam@example.com",
        content: "Visit https://one.test https://two.test https://three.test now",
      });

      expect(created.status).toBe("spam");
      expect(created.spamReason).toBe("too_many_links");

      const saved = await db.query.comments.findFirst({
        where: eq(comments.id, created.id),
      });

      expect(saved?.status).toBe("spam");
      expect(saved?.spamReason).toBe("too_many_links");
    });
  }, 15000);
});

