import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { desc } from "drizzle-orm";
import { PostCard, cardThemes } from "#/components/blog/PostCard";
import { useMemo, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Newsletter } from "#/components/blog/newsletter";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

const getLatestPosts = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select()
    .from(posts)
    .orderBy(desc(posts.publishedAt))
    .limit(12);
});

export const Route = createFileRoute("/blog/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
  }),
  loader: () => getLatestPosts(),
  head: (ctx: any) => {
    const search = ctx.search as { q?: string; category?: string };
    const q = search.q || "";
    const hasQuery = q.trim().length > 0;
    return {
      meta: [
        {
          title: hasQuery
            ? `Search "${search.q}" | VibeZine`
            : "All Stories | VibeZine Blog",
        },
        {
          name: "description",
          content: hasQuery
            ? `Search results for "${search.q}" in VibeZine stories.`
            : "Browse all articles on design, tech, and cultural experiments.",
        },
      ],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const latestPosts = Route.useLoaderData();
  const search = Route.useSearch();
  const q = typeof search.q === "string" ? search.q : "";
  const category = typeof search.category === "string" ? search.category : "";

  const navigate = useNavigate();
  const query = q.trim().toLowerCase();
  const [localSearch, setLocalSearch] = useState(q);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  const filteredPosts = useMemo(() => {
    return latestPosts.filter((post: any) => {
      const matchesQuery =
        !query ||
        String(post.title || "")
          .toLowerCase()
          .includes(query) ||
        String(post.excerpt || "")
          .toLowerCase()
          .includes(query);

      const postId = Number(post.id) || 0;
      const postCategory = cardThemes[postId % cardThemes.length]?.badge || "";
      const matchesCategory =
        !category || postCategory.toLowerCase() === category.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [latestPosts, query, category]);

  function handleSearch(val: string) {
    setLocalSearch(val);
    navigate({
      to: ".",
      search: (prev: any) => ({ ...prev, q: val || undefined }),
    });
  }

  function handleCategory(cat: string) {
    navigate({
      to: ".",
      search: (prev: any) => ({ ...prev, category: cat || undefined }),
    });
  }

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <header className="island-shell rounded-2xl p-8 sm:p-12 bg-card">
          <p className="inline-block tracking-widest uppercase font-extrabold text-xs text-primary-foreground bg-primary px-2.5 py-1 border-2 border-border mb-3 -skew-x-12">Vibe Archive</p>
          <h1 className="font-serif leading-[1.08] tracking-tight text-balance font-extrabold mb-4 text-5xl text-foreground sm:text-6xl uppercase">
            All Stories
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground font-bold leading-tight">
            Bold notes on design, cultural code, and aesthetic experiments.
          </p>
        </header>

        <section className="island-shell flex flex-col gap-8 rounded-2xl p-6 sm:p-8 bg-card">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stories..."
              className="h-14 w-full rounded-lg border-3 border-border bg-background/50 pl-12 pr-12 font-bold text-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/20 shadow-zine-sm"
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
              variant={!category ? "zine" : "zine-outline"}
              className={cn(
                "toy-button rounded-lg border-2 border-border px-6 py-2 font-black shadow-zine-sm sm:border-3 transition-all",
                !category && "scale-105 z-10"
              )}
            >
              ✨ All Stories
            </Button>
            {cardThemes.map((theme) => {
              const isActive =
                category && category.toLowerCase() === theme.badge.toLowerCase();
              return (
                <Button
                  key={theme.badge}
                  onClick={() => handleCategory(theme.badge)}
                  variant={isActive ? "zine" : "zine-outline"}
                  className={cn(
                    "toy-button rounded-lg border-2 border-border px-6 py-2 font-black shadow-zine-sm sm:border-3 transition-all",
                    isActive && `${theme.cover} scale-105 z-10`
                  )}
                >
                  {theme.badge}
                </Button>
              );
            })}
          </div>
        </section>

        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="island-shell flex flex-col items-center justify-center rounded-2xl py-20 text-center bg-card">
            <div className="mb-4 rounded-lg bg-muted p-4 border-2 border-border">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
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
