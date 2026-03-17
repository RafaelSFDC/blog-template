import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

vi.mock("#/server/auth/session", () => ({
  getAuthSession: vi.fn().mockResolvedValue({
    user: {
      id: "editor-user",
      email: "editor@lumina.test",
      role: "editor",
    },
  }),
  requireDashboardAccess: vi.fn().mockResolvedValue({
    user: {
      id: "editor-user",
      email: "editor@lumina.test",
      role: "editor",
    },
  }),
  requireSession: vi.fn().mockResolvedValue({
    user: {
      id: "editor-user",
      email: "editor@lumina.test",
      role: "editor",
    },
  }),
}));

describe("editorial lifecycle integration", () => {
  it("supports create, update, revision restore, and slug uniqueness for posts", async () => {
    await withIsolatedDatabase("editorial-lifecycle", async () => {
      const { createPost, restorePostRevision, updatePost } = await import(
        "#/server/actions/content/post-actions"
      );
      const { db } = await import("#/db/index");
      const { postRevisions, posts, user } = await import("#/db/schema");

      await db.insert(user).values({
        id: "editor-user",
        name: "Editor User",
        email: "editor@lumina.test",
        emailVerified: true,
        role: "editor",
      });

      const baseInput = {
        title: "First Draft",
        slug: "first-draft",
        excerpt: "Draft excerpt",
        content: "Draft content",
        metaTitle: undefined,
        metaDescription: undefined,
        ogImage: undefined,
        seoNoIndex: false,
        isPremium: false,
        teaserMode: "excerpt" as const,
        commentsEnabled: true,
        status: "draft" as const,
        publishedAt: undefined,
        editorOwnerId: undefined,
        categoryIds: [] as number[],
        tagIds: [] as number[],
      };

      await createPost({ data: baseInput });
      const created = await db.query.posts.findFirst({
        where: eq(posts.slug, "first-draft"),
      });
      expect(created?.id).toBeGreaterThan(0);

      await updatePost({
        data: {
          ...baseInput,
          id: created!.id,
          title: "First Draft Updated",
          content: "Draft content updated",
        },
      });

      const revisions = await db
        .select()
        .from(postRevisions)
        .where(eq(postRevisions.postId, created!.id));
      expect(revisions.length).toBeGreaterThanOrEqual(2);

      await restorePostRevision({ data: { revisionId: revisions[0].id } });
      const restored = await db.query.posts.findFirst({
        where: (table, { eq }) => eq(table.id, created!.id),
      });
      expect(restored?.status).toBe("draft");

      await expect(
        createPost({
          data: {
            ...baseInput,
            title: "Duplicate Slug Post",
            slug: "first-draft",
          },
        }),
      ).rejects.toThrow(/slug/i);

      const currentPost = await db.query.posts.findFirst({
        where: eq(posts.id, created!.id),
      });
      expect(currentPost?.title).toBeTruthy();
    });
  }, 20000);
});
