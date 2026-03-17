import { describe, expect, it } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

describe("public listing integration", () => {
  it("does not duplicate blog index posts when a post has multiple categories", async () => {
    await withIsolatedDatabase("public-listing-blog", async () => {
      const { db } = await import("#/db/index");
      const { categories, postCategories, posts, user } = await import("#/db/schema");
      const { queryBlogIndexPosts } = await import("#/server/public/blog");

      await db.insert(user).values({
        id: "author-fixture",
        name: "Fixture Author",
        email: "author@lumina.test",
      });

      const [categoryA, categoryB] = await db
        .insert(categories)
        .values([
          { name: "Category A", slug: "category-a" },
          { name: "Category B", slug: "category-b" },
        ])
        .returning();

      const [post] = await db
        .insert(posts)
        .values({
          slug: "hello-world",
          title: "Hello World",
          excerpt: "excerpt",
          content: "content",
          status: "published",
          publishedAt: new Date(),
          authorId: "author-fixture",
        })
        .returning();

      await db.insert(postCategories).values([
        { postId: post.id, categoryId: categoryA.id },
        { postId: post.id, categoryId: categoryB.id },
      ]);

      const result = await queryBlogIndexPosts({ page: 1, q: "" });

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0]?.id).toBe(post.id);
    });
  }, 15000);

  it("does not duplicate archive posts when a post has multiple categories", async () => {
    await withIsolatedDatabase("public-listing-archive", async () => {
      const { db } = await import("#/db/index");
      const { categories, postCategories, posts } = await import("#/db/schema");
      const { getArchivePosts } = await import("#/server/public-discovery");

      const [categoryA, categoryB] = await db
        .insert(categories)
        .values([
          { name: "Category A", slug: "category-a" },
          { name: "Category B", slug: "category-b" },
        ])
        .returning();

      const publishedAt = new Date(Date.UTC(2026, 0, 20, 12, 0, 0));
      const [post] = await db
        .insert(posts)
        .values({
          slug: "archive-post",
          title: "Archive Post",
          excerpt: "excerpt",
          content: "content",
          status: "published",
          publishedAt,
        })
        .returning();

      await db.insert(postCategories).values([
        { postId: post.id, categoryId: categoryA.id },
        { postId: post.id, categoryId: categoryB.id },
      ]);

      const result = await getArchivePosts(2026, 1, 1);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0]?.id).toBe(post.id);
    });
  }, 15000);
});
