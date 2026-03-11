import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { desc, eq } from "drizzle-orm";
import { useEffect, useMemo, useState } from "react";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { Search, X } from "lucide-react";
import { Newsletter } from "#/components/blog/newsletter";
import { Button } from "#/components/ui/button";
import { SiteHeader } from "#/components/SiteHeader";
import { Input } from "#/components/ui/input";
import { IconBox } from "#/components/IconBox";
import { categories, postCategories, posts } from "#/db/schema";
import { type InferSelectModel } from "drizzle-orm";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildPublicSeo } from "#/lib/seo";

type Category = InferSelectModel<typeof categories>;
type BlogIndexLoaderData = {
  posts: Post[];
  categories: Category[];
  search: { q?: string };
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
};

const getLatestPosts = createServerFn({ method: "GET" }).handler(async () => {
  return db
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
    .limit(12);
});

const getPublicCategories = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(categories);
});

export const Route = createFileRoute("/_public/blog/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    q: search.q,
  }),
  loader: async ({ deps }) => {
    const [postsData, categoriesData, site] = await Promise.all([
      getLatestPosts(),
      getPublicCategories(),
      getSeoSiteData(),
    ]);
    return { posts: postsData, categories: categoriesData, search: deps, site };
  },
  head: ({ loaderData }) => {
    const data = loaderData as BlogIndexLoaderData | undefined;
    const search = data?.search;
    const q = search?.q || "";
    const hasQuery = q.trim().length > 0;

    if (!data?.site) {
      return {};
    }

    return buildPublicSeo({
      site: data.site,
      path: "/blog",
      title: hasQuery
        ? `Search "${q}" | ${data.site.blogName}`
        : `All Stories | ${data.site.blogName}`,
      description: hasQuery
        ? `Search results for "${q}" in ${data.site.blogName}.`
        : data.site.defaultMetaDescription ||
          "Browse all articles on design, tech, and cultural experiments.",
      image: data.site.defaultOgImage,
      indexable: !hasQuery && data.site.robotsIndexingEnabled,
    });
  },
  component: BlogIndex,
});

function BlogIndex() {
  const {
    posts: latestPosts,
    categories: dbCategories,
    search,
  } = Route.useLoaderData() as BlogIndexLoaderData;
  const q = typeof search.q === "string" ? search.q : "";

  const navigate = useNavigate();
  const query = q.trim().toLowerCase();
  const [localSearch, setLocalSearch] = useState(q);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  const filteredPosts = useMemo(() => {
    return latestPosts.filter((post) => {
      return (
        !query ||
        String(post.title || "").toLowerCase().includes(query) ||
        String(post.excerpt || "").toLowerCase().includes(query)
      );
    });
  }, [latestPosts, query]);

  function handleSearch(val: string) {
    setLocalSearch(val);
    navigate({
      to: ".",
      search: () => ({ q: val || undefined }),
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

        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <div className="bg-card border shadow-sm flex flex-col items-center justify-center rounded-md py-20 text-center">
            <IconBox icon={Search} className="mb-4" />
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              {query ? `Search for "${q}" failed` : "No stories found"}
            </h2>
            <p className="mt-2 text-muted-foreground font-bold">
              {query
                ? "Try different keywords or check your spelling."
                : "The archive is currently empty."}
            </p>
          </div>
        )}

        <Newsletter />
      </div>
    </main>
  );
}
