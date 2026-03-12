import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { count, desc, eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { Search, X } from "lucide-react";
import { Newsletter } from "#/components/blog/newsletter";
import { Button } from "#/components/ui/button";
import { SiteHeader } from "#/components/SiteHeader";
import { Input } from "#/components/ui/input";
import { IconBox } from "#/components/IconBox";
import { categories, postCategories, posts, postTags, tags } from "#/db/schema";
import { type InferSelectModel } from "drizzle-orm";
import { BLOG_PAGE_SIZE } from "#/server/taxonomy-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildCanonicalUrl, buildPublicSeo } from "#/lib/seo";
import { getPaginationMeta, normalizePage } from "#/lib/pagination";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { normalizeSearchQuery, rankSearchPosts } from "#/server/post-search";

type Category = InferSelectModel<typeof categories>;
type BlogIndexLoaderData = {
  posts: Post[];
  categories: Category[];
  search: { q?: string; page: number };
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
  pagination: ReturnType<typeof getPaginationMeta>;
};

const getLatestPosts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const parsed = (input || {}) as { q?: string; page?: number };
    return {
      q: normalizeSearchQuery(typeof parsed.q === "string" ? parsed.q : ""),
      page: normalizePage(parsed.page),
    };
  })
  .handler(async ({ data }) => {
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
        })
        .from(posts)
        .leftJoin(postCategories, eq(posts.id, postCategories.postId))
        .leftJoin(categories, eq(postCategories.categoryId, categories.id))
        .leftJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.publishedAt));

      const rankedPosts = rankSearchPosts(searchRows, data.q);
      const pagination = getPaginationMeta(rankedPosts.length, data.page, BLOG_PAGE_SIZE);

      return {
        posts: rankedPosts.slice(pagination.offset, pagination.offset + BLOG_PAGE_SIZE),
        pagination,
      };
    }

    const [{ total }] = await db.select({ total: count() }).from(posts).where(eq(posts.status, "published"));

    const pagination = getPaginationMeta(total, data.page, BLOG_PAGE_SIZE);

    const rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        publishedAt: posts.publishedAt,
        category: categories.name,
        categorySlug: categories.slug,
      })
      .from(posts)
      .leftJoin(postCategories, eq(posts.id, postCategories.postId))
      .leftJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(BLOG_PAGE_SIZE)
      .offset(pagination.offset);

    return {
      posts: rows,
      pagination,
    };
  });

const getPublicCategories = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(categories);
});

export const Route = createFileRoute("/_public/blog/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => ({
    q: search.q,
    page: search.page,
  }),
  loader: async ({ deps }) => {
    const [postsData, categoriesData, site] = await Promise.all([
      getLatestPosts({ data: deps }),
      getPublicCategories(),
      getSeoSiteData(),
    ]);
    return {
      posts: postsData.posts,
      categories: categoriesData,
      search: deps,
      site,
      pagination: postsData.pagination,
    };
  },
  head: ({ loaderData }) => {
    const data = loaderData as BlogIndexLoaderData | undefined;
    const search = data?.search;
    const q = search?.q || "";
    const page = search?.page || 1;
    const hasQuery = q.trim().length > 0;

    if (!data?.site) {
      return {};
    }

    const path = `/blog${page > 1 ? `?page=${page}` : ""}`;
    const links = [];

    if (data.pagination.hasPreviousPage) {
      links.push({
        rel: "prev",
        href: buildCanonicalUrl(
          data.site.siteUrl,
          `/blog${page - 1 > 1 ? `?page=${page - 1}` : ""}${hasQuery ? `${page - 1 > 1 ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`,
        ),
      });
    }

    if (data.pagination.hasNextPage) {
      links.push({
        rel: "next",
        href: buildCanonicalUrl(
          data.site.siteUrl,
          `/blog?page=${page + 1}${hasQuery ? `&q=${encodeURIComponent(q)}` : ""}`,
        ),
      });
    }

    return buildPublicSeo({
      site: data.site,
      path: hasQuery ? `/blog?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ""}` : path,
      title: hasQuery
        ? `Search "${q}" | ${data.site.blogName}`
        : page > 1
          ? `All Stories - Page ${page} | ${data.site.blogName}`
          : `All Stories | ${data.site.blogName}`,
      description: hasQuery
        ? `Search results for "${q}" in ${data.site.blogName}.`
        : page > 1
          ? `Browse page ${page} of published stories in ${data.site.blogName}.`
          : data.site.defaultMetaDescription ||
            "Browse all articles on design, tech, and cultural experiments.",
      image: data.site.defaultOgImage,
      indexable: !hasQuery && data.site.robotsIndexingEnabled,
      links,
    });
  },
  component: BlogIndex,
});

function BlogIndex() {
  const {
    posts: latestPosts,
    categories: dbCategories,
    search,
    pagination,
  } = Route.useLoaderData() as BlogIndexLoaderData;
  const q = typeof search.q === "string" ? search.q : "";

  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(q);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  function handleSearch(val: string) {
    setLocalSearch(val);
    navigate({
      to: ".",
      search: () => ({ q: val || undefined, page: undefined }),
    });
  }

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <SiteHeader
          badge="The Collection"
          title="All Stories"
          description="Bold notes on design, cultural code, and aesthetic experiments."
        />

        <section className="bg-card border shadow-sm flex flex-col gap-8 rounded-md p-6 sm:p-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stories..."
              className=" pl-12 pr-12"
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" className="rounded-md px-6 py-2 shadow-sm">
              <Link to="/blog">All Stories</Link>
            </Button>
            {dbCategories.map((cat: Category) => (
              <Button
                key={cat.id}
                asChild
                variant="outline"
                className="rounded-md border border-border px-6 py-2 shadow-sm transition-all"
              >
                <Link to="/blog/category/$slug" params={{ slug: cat.slug }}>
                  {cat.name}
                </Link>
              </Button>
            ))}
          </div>
        </section>

        {latestPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <div className="bg-card border shadow-sm flex flex-col items-center justify-center rounded-md py-20 text-center">
            <IconBox icon={Search} className="mb-4" />
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              {q ? `Search for "${q}" failed` : "No stories found"}
            </h2>
            <p className="mt-2 text-muted-foreground font-bold">
              {q
                ? "Try different keywords or check your spelling."
                : "The archive is currently empty."}
            </p>
          </div>
        )}

        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          to="/blog"
          search={{ q: q || undefined }}
        />

        <Newsletter />
      </div>
    </main>
  );
}
