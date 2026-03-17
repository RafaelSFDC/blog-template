import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { db } from "#/server/db/index";
import { posts } from "#/server/db/schema";
import { requireAdminSession } from "#/server/auth/session";

export const getNewsletterTemplatePosts = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    return db
      .select({
        id: posts.id,
        title: posts.title,
        excerpt: posts.excerpt,
        slug: posts.slug,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .orderBy(desc(posts.publishedAt))
      .limit(10);
  },
);

