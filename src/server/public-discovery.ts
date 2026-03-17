import { and, count, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { categories, postCategories, posts, postTags, user } from "#/db/schema";
import { BLOG_PAGE_SIZE } from "#/server/actions/content/taxonomy-actions";
import { getPaginationMeta } from "#/lib/pagination";

export async function getAuthorPageBySlug(slug: string, page = 1) {
  const author = await db.query.user.findFirst({
    where: eq(user.publicAuthorSlug, slug),
    columns: {
      id: true,
      name: true,
      image: true,
      publicAuthorSlug: true,
      authorBio: true,
      authorHeadline: true,
      authorSeoTitle: true,
      authorSeoDescription: true,
    },
  });

  if (!author) {
    return null;
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(posts)
    .where(and(eq(posts.status, "published"), eq(posts.authorId, author.id)));

  const pagination = getPaginationMeta(total, page, BLOG_PAGE_SIZE);

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.status, "published"), eq(posts.authorId, author.id)))
    .orderBy(desc(posts.publishedAt))
    .limit(BLOG_PAGE_SIZE)
    .offset(pagination.offset);

  return {
    author,
    posts: rows,
    pagination,
  };
}

export async function getArchivePosts(year: number, month?: number, page = 1) {
  const start = new Date(Date.UTC(year, month ? month - 1 : 0, 1, 0, 0, 0));
  const end = month
    ? new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const [{ total }] = await db
    .select({ total: count() })
    .from(posts)
    .where(
      and(eq(posts.status, "published"), gte(posts.publishedAt, start), lte(posts.publishedAt, end)),
    );

  const pagination = getPaginationMeta(total, page, BLOG_PAGE_SIZE);

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
    })
    .from(posts)
    .where(
      and(eq(posts.status, "published"), gte(posts.publishedAt, start), lte(posts.publishedAt, end)),
    )
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(BLOG_PAGE_SIZE)
    .offset(pagination.offset);

  return {
    posts: rows,
    pagination,
    year,
    month: month ?? null,
  };
}

export async function getRelatedPostsByTaxonomy(postId: number) {
  const sourcePost = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: {
      id: true,
    },
    with: {
      postCategories: {
        columns: {
          categoryId: true,
        },
      },
      postTags: {
        columns: {
          tagId: true,
        },
      },
    },
  });

  if (!sourcePost) {
    return [];
  }

  const categoryIds = sourcePost.postCategories.map(
    (item: (typeof sourcePost.postCategories)[number]) => item.categoryId,
  );
  const tagIds = sourcePost.postTags.map(
    (item: (typeof sourcePost.postTags)[number]) => item.tagId,
  );

  const candidateRows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
      categoryId: postCategories.categoryId,
      tagId: postTags.tagId,
      category: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.id, postCategories.postId))
    .leftJoin(categories, eq(postCategories.categoryId, categories.id))
    .leftJoin(postTags, eq(posts.id, postTags.postId))
    .where(and(eq(posts.status, "published"), ne(posts.id, postId)))
    .orderBy(desc(posts.publishedAt));

  const scored = new Map<number, {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string | null;
    publishedAt: Date | string | null;
    category?: string | null;
    categorySlug?: string | null;
    categoryMatches: number;
    tagMatches: number;
  }>();

  for (const row of candidateRows as (typeof candidateRows)) {
    const entry = scored.get(row.id) ?? {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.coverImage,
      publishedAt: row.publishedAt,
      category: row.category,
      categorySlug: row.categorySlug,
      categoryMatches: 0,
      tagMatches: 0,
    };

    if (row.categoryId && categoryIds.includes(row.categoryId)) {
      entry.categoryMatches += 1;
    }
    if (row.tagId && tagIds.includes(row.tagId)) {
      entry.tagMatches += 1;
    }

    scored.set(row.id, entry);
  }

  return [...scored.values()]
    .filter((entry) => entry.categoryMatches > 0 || entry.tagMatches > 0)
    .sort((a, b) => {
      if (b.categoryMatches !== a.categoryMatches) {
        return b.categoryMatches - a.categoryMatches;
      }
      if (b.tagMatches !== a.tagMatches) {
        return b.tagMatches - a.tagMatches;
      }
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);
}

export async function getPublishedArchiveYears() {
  const rows = await db
    .select({
      year: sql<number>`CAST(strftime('%Y', ${posts.publishedAt}) AS INTEGER)`,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .groupBy(sql`strftime('%Y', ${posts.publishedAt})`)
    .orderBy(sql`strftime('%Y', ${posts.publishedAt}) DESC`);

  return rows.map((row: (typeof rows)[number]) => row.year).filter(Boolean);
}
