import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { desc, eq } from "drizzle-orm";
import { PostCard } from "#/components/blog/PostCard";
import { ArrowRight } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Newsletter } from "#/components/blog/newsletter";

const getTopPosts = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(3);
});

export const Route = createFileRoute("/_public/")({
  loader: () => getTopPosts(),
  head: () => ({
    meta: [
      { title: "Lumina | Elegant Stories" },
      {
        name: "description",
        content:
          "Join Lumina. Discover elegant stories on design, culture, and high-quality code.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const latestPosts: any[] = Route.useLoaderData();

  return (
    <main className="page-wrap pb-16 pt-6">
      <section className="editorial-grid rise-in gap-8">
        <div className="bg-card border shadow-sm col-span-12 overflow-hidden rounded-md p-8 sm:p-10 lg:p-12 relative">
          <Badge variant="default">Issue #01 / Spring 2026</Badge>
          <h1 className="display-title font-bold leading-tight tracking-tight text-balance mb-6 max-w-4xl text-foreground text-4xl sm:text-5xl lg:text-7xl">
            Stories With A <br />
            <span className="text-primary">Visual Signature.</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground font-black text-lg md:text-xl">
            A bold editorial system with sharp edges, fast rendering, and a
            layout that actually has a soul.
          </p>

          <Newsletter
            variant="compact"
            placeholder="Join the newsletter..."
            className="mt-12"
          />

          <div className="mt-8 flex flex-wrap gap-4 border-t pt-8 border-border">
            <Link
              to="/blog"
              search={{ q: "", category: "" }}
              className="group flex items-center gap-2 font-medium text-foreground  hover:text-primary transition-colors"
            >
              Learn More About Our Vision
              <ArrowRight
                size={16}
                strokeWidth={3}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <header className="bg-card border shadow-sm flex items-center justify-between rounded-md p-6 sm:p-8 mb-10 transition-transform hover:-translate-y-1">
          <h2 className="display-title text-2xl font-bold text-foreground sm:text-3xl">
            Featured Articles
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/blog"
              search={{ q: "", category: "" }}
              className="flex items-center gap-2"
            >
              Ver Todos
              <ArrowRight size={16} />
            </Link>
          </Button>
        </header>

        {latestPosts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-card border shadow-sm rounded-md p-12 text-center">
            <p className="text-muted-foreground">
              No posts yet. Run the seed command to create your first 5
              articles.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
