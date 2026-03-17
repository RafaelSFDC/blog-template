import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { categories, postCategories, posts, postTags, tags, user } from "#/db/schema";
import { getPaginationMeta, normalizePage } from "#/lib/pagination";
import { getPublicCacheControl } from "#/lib/seo";
import { normalizeSearchQuery, rankSearchPosts } from "#/server/post-search";
import { BLOG_PAGE_SIZE } from "#/server/actions/content/taxonomy-actions";

export const getBlogIndexPosts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const parsed = (input || {}) as { q?: string; page?: number };
    return {
      q: normalizeSearchQuery(typeof parsed.q === "string" ? parsed.q : ""),
      page: normalizePage(parsed.page),
    };
  })
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", getPublicCacheControl(600, 3600));
    return queryBlogIndexPosts(data);
  });

export async function queryBlogIndexPosts(data: { q: string; page: number }) {
  if (data.q) {
    const searchRows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        content: posts.content,
        coverImage: posts.coverImage,
        publishedAt: posts.publishedAt,
        category: categories.name,
        categorySlug: categories.slug,
        tag: tags.name,
        authorName: user.name,
        authorHeadline: user.authorHeadline,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .leftJoin(postCategories, eq(posts.id, postCategories.postId))
      .leftJoin(categories, eq(postCategories.categoryId, categories.id))
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.id));

    const rankedPosts = rankSearchPosts(searchRows, data.q);
    const pagination = getPaginationMeta(rankedPosts.length, data.page, BLOG_PAGE_SIZE);

    return {
      posts: rankedPosts.slice(pagination.offset, pagination.offset + BLOG_PAGE_SIZE),
      pagination,
    };
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(posts)
    .where(eq(posts.status, "published"));

  const pagination = getPaginationMeta(total, data.page, BLOG_PAGE_SIZE);

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
      category: sql<string | null>`(
          select ${categories.name}
          from ${postCategories}
          inner join ${categories}
            on ${categories.id} = ${postCategories.categoryId}
          where ${postCategories.postId} = ${posts.id}
          order by ${postCategories.categoryId} asc
          limit 1
        )`.as("category"),
      categorySlug: sql<string | null>`(
          select ${categories.slug}
          from ${postCategories}
          inner join ${categories}
            on ${categories.id} = ${postCategories.categoryId}
          where ${postCategories.postId} = ${posts.id}
          order by ${postCategories.categoryId} asc
          limit 1
        )`.as("categorySlug"),
      authorName: user.name,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(BLOG_PAGE_SIZE)
    .offset(pagination.offset);

  return {
    posts: rows,
    pagination,
  };
}

export const getPublicCategories = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(categories);
});
