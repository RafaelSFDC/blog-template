import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { desc, eq } from "drizzle-orm";
import { useMemo, useState, useEffect } from "react";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { Search, X } from "lucide-react";
import { Newsletter } from "#/components/blog/newsletter";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { SiteHeader } from "#/components/SiteHeader";
import { Input } from "#/components/ui/input";
import { IconBox } from "#/components/IconBox";

import { posts, categories, postCategories } from "#/db/schema";
import { type InferSelectModel } from "drizzle-orm";

type Category = InferSelectModel<typeof categories>;
type BlogIndexLoaderData = {
  posts: Post[];
  categories: Category[];
  search: { q?: string; category?: string };
};


const getLatestPosts = createServerFn({ method: "GET" }).handler(async () => {
  const data = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
      category: categories.name,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.id, postCategories.postId))
    .leftJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(12);

  return data;
});

const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(categories);
});

export const Route = createFileRoute("/_public/blog/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    category: (search.category as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    q: search.q,
    category: search.category,
  }),
  loader: async ({ deps }) => {
    const [posts, categories] = await Promise.all([
      getLatestPosts(),
      getCategories(),
    ]);
    return { posts, categories, search: deps };
  },
  head: ({ loaderData }) => {
    const data = loaderData as {
      search: { q?: string; category?: string };
    } | undefined;
    const search = data?.search;
    const q = search?.q || "";
    const hasQuery = q.trim().length > 0;
    return {
      meta: [
        {
          title: hasQuery
            ? `Search "${q}" | Lumina`
            : "All Stories | Lumina Blog",
        },
        {
          name: "description",
          content: hasQuery
            ? `Search results for "${q}" in Lumina stories.`
            : "Browse all articles on design, tech, and cultural experiments.",
        },
      ],
    };
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
  const category = typeof search.category === "string" ? search.category : "";

  const navigate = useNavigate();
  const query = q.trim().toLowerCase();
  const [localSearch, setLocalSearch] = useState(q);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  const filteredPosts = useMemo(() => {
    return latestPosts.filter((post) => {
      const matchesQuery =
        !query ||
        String(post.title || "")
          .toLowerCase()
          .includes(query) ||
        String(post.excerpt || "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !category || post.category?.toLowerCase() === category.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [latestPosts, query, category]);

  function handleSearch(val: string) {
    setLocalSearch(val);
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, q: val || undefined }),
    });
  }

  function handleCategory(cat: string) {
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, category: cat || undefined }),
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
            <Button
              onClick={() => handleCategory("")}
              variant={!category ? "default" : "outline"}
              className={cn(
                "rounded-md border border-border px-6 py-2 shadow-sm transition-all",
              )}
            >
              All Stories
            </Button>
            {dbCategories.map((cat: Category) => {
              const isActive =
                category && category.toLowerCase() === cat.name.toLowerCase();
              return (
                <Button
                  key={cat.id}
                  onClick={() => handleCategory(cat.name!)}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "rounded-md border border-border px-6 py-2 shadow-sm transition-all",
                  )}
                >
                  {cat.name}
                </Button>
              );
            })}
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
