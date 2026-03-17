import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { Search, X } from "lucide-react";
import { Newsletter } from "#/components/blog/newsletter";
import { Button } from "#/components/ui/button";
import { SiteHeader } from "#/components/SiteHeader";
import { Input } from "#/components/ui/input";
import { IconBox } from "#/components/IconBox";
import { categories } from "#/server/db/schema";
import { type InferSelectModel } from "drizzle-orm";
import { getSeoSiteData } from "#/server/actions/seo-actions";
import {
  buildPaginatedPath,
  buildPaginationLinks,
  buildPublicSeo,
  resolvePublicIndexability,
} from "#/lib/seo";
import { getPaginationMeta, normalizePage } from "#/lib/pagination";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { getBlogIndexPosts, getPublicCategories } from "#/server/actions/public/blog";

type Category = InferSelectModel<typeof categories>;
type BlogIndexLoaderData = {
  posts: Post[];
  categories: Category[];
  search: { q?: string; page: number };
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
  pagination: ReturnType<typeof getPaginationMeta>;
};

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
      getBlogIndexPosts({ data: deps }),
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

    const path = buildPaginatedPath({
      path: "/blog",
      page,
      query: { q: hasQuery ? q : undefined },
    });
    const links = buildPaginationLinks({
      siteUrl: data.site.siteUrl,
      path: "/blog",
      currentPage: page,
      hasPreviousPage: data.pagination.hasPreviousPage,
      hasNextPage: data.pagination.hasNextPage,
      query: { q: hasQuery ? q : undefined },
    });

    return buildPublicSeo({
      site: data.site,
      path,
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
      indexable: resolvePublicIndexability({
        site: data.site,
        hasQuery,
        currentPage: page,
      }),
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
              <Link to="/blog" search={{ q: undefined, page: 1 }}>All Stories</Link>
            </Button>
            {dbCategories.map((cat: Category) => (
              <Button
                key={cat.id}
                asChild
                variant="outline"
                className="rounded-md border border-border px-6 py-2 shadow-sm transition-all"
              >
                <Link
                  to="/blog/category/$slug"
                  params={{ slug: cat.slug }}
                  search={{ page: 1 }}
                >
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

