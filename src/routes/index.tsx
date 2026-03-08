import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { desc } from "drizzle-orm";
import { PostCard } from "#/components/blog/PostCard";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Newsletter } from "#/components/blog/newsletter";

function MarqueeTicker() {
  const items = [
    "VibeZine Vol. 1 Out Now",
    "Design is not a crime",
    "High-Energy Code",
    "Editorial Excellence",
    "The Soul of the Web",
    "Analog Vibes",
    "Future Proofing...",
  ];
  return (
    <div className="zine-marquee mt-8 mb-12">
      <div className="zine-marquee-content">
        {items.map((item, i) => (
          <div key={i} className="zine-marquee-item flex items-center gap-2">
            <TrendingUp size={16} strokeWidth={4} className="text-primary" />
            {item}
            <span className="mx-4 text-border opacity-30">•</span>
          </div>
        ))}
      </div>
      <div className="zine-marquee-content" aria-hidden="true">
        {items.map((item, i) => (
          <div key={i} className="zine-marquee-item flex items-center gap-2">
            <TrendingUp size={16} strokeWidth={4} className="text-primary" />
            {item}
            <span className="mx-4 text-border opacity-30">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const getTopPosts = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select()
    .from(posts)
    .orderBy(desc(posts.publishedAt))
    .limit(3);
});

export const Route = createFileRoute("/")({
  loader: () => getTopPosts(),
  head: () => ({
    meta: [
      { title: "VibeZine | Bold Stories" },
      {
        name: "description",
        content:
          "Join the vibe. Discovery edgy stories on design, culture, and high-energy code.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const latestPosts: any[] = Route.useLoaderData();

  return (
    <main className="page-wrap pb-16 pt-6">
      <MarqueeTicker />

      <section className="editorial-grid rise-in gap-8">
        <div className="island-shell col-span-12 overflow-hidden rounded-lg p-8 sm:p-10 lg:p-12 relative">


          <p className="inline-block tracking-widest uppercase font-extrabold text-xs text-primary-foreground bg-primary px-2.5 py-1 border-2 border-border mb-2 -skew-x-12">Issue #01 / Spring 2026</p>
          <h1 className="display-title text-[clamp(2.3rem,9vw,5.2rem)] font-bold leading-tight tracking-tight text-balance mb-6 max-w-4xl text-foreground">
            Stories With A <br />
            <span className="text-primary italic">Visual Signature.</span>
          </h1>
          <p className="text-[clamp(1rem,2vw,1.35rem)] max-w-2xl text-muted-foreground font-black">
            A bold editorial system with sharp edges, fast rendering, and a
            layout that actually has a soul.
          </p>

          <Newsletter variant="compact" placeholder="Join the newsletter..." className="mt-12" />

          <div className="mt-8 flex flex-wrap gap-4 border-t-2 border-border/10 pt-8">
            <Link
              to="/blog"
              search={{ q: "", category: "" }}
              className="group flex items-center gap-2 text-sm font-black text-foreground no-underline uppercase tracking-widest hover:text-primary transition-colors"
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
        <header className="island-shell flex items-center justify-between rounded-2xl bg-card p-6 sm:p-8 mb-10 transition-transform hover:-translate-y-1">
          <h2 className="display-title mb-0 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            Featured Articles
          </h2>
          <Button asChild variant="zine-outline" size="sm">
            <Link to="/blog" search={{ q: "", category: "" }} className="flex items-center gap-2">
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
          <div className="island-shell rounded-3xl p-12 text-center">
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
