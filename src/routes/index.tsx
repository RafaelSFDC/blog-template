import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { desc } from "drizzle-orm";
import { PostCard } from "#/components/blog/PostCard";
import { Zap, Mail, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "#/components/ui/button";

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
        <div className="island-shell col-span-12 overflow-hidden rounded-lg p-8 sm:p-10 lg:col-span-8 lg:p-12 relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Zap size={180} strokeWidth={3} className="text-primary" />
          </div>

          <p className="island-kicker">Issue #01 / Spring 2026</p>
          <h1 className="display-title headline-fluid mb-6 max-w-4xl text-foreground">
            Stories With A <br />
            <span className="text-primary italic">Visual Signature.</span>
          </h1>
          <p className="subhead-fluid max-w-2xl text-muted-foreground font-black">
            A bold editorial system with sharp edges, fast rendering, and a
            layout that actually has a soul.
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-12 flex flex-col sm:flex-row gap-3 max-w-md"
          >
            <div className="relative flex-1">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="email"
                placeholder="Join the newsletter..."
                className="h-12 w-full rounded-lg border-2 border-border bg-background pl-11 pr-4 text-sm font-bold shadow-zine-sm outline-none focus:ring-4 focus:ring-primary/20"
              />
            </div>
            <Button variant="zine" size="lg" className="sm:w-auto">
              Join
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap gap-4 border-t-2 border-border/10 pt-8">
            <Link
              to="/blog"
              search={{ q: "" }}
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

        <aside className="island-shell reveal-card col-span-12 rounded-lg p-8 lg:col-span-4 bg-secondary/5 border-secondary/20">
          <p className="island-kicker bg-secondary! text-secondary-foreground!">
            The Specs
          </p>
          <dl className="mt-6 space-y-8">
            <div className="group">
              <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black group-hover:text-primary transition-colors">
                Framework
              </dt>
              <dd className="display-title mt-1 text-3xl text-foreground">
                TanStack Start
              </dd>
              <div className="h-1 w-12 bg-primary mt-2 group-hover:w-20 transition-all duration-300"></div>
            </div>
            <div className="group">
              <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black group-hover:text-secondary transition-colors">
                Persistence
              </dt>
              <dd className="display-title mt-1 text-3xl text-foreground">
                Drizzle + SQLite
              </dd>
              <div className="h-1 w-8 bg-secondary mt-2 group-hover:w-16 transition-all duration-300"></div>
            </div>
            <div className="group">
              <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black group-hover:text-accent transition-colors">
                Library Size
              </dt>
              <dd className="display-title mt-1 text-4xl text-foreground font-black">
                {latestPosts.length}{" "}
                <span className="text-xl opacity-40">Posts</span>
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            <Button
              asChild
              variant="zine"
              size="lg"
              className="w-full text-white"
            >
              <Link to="/blog" search={{ q: "" }} className="text-white">
                Start Reading
              </Link>
            </Button>
          </div>
        </aside>
      </section>

      <section className="mt-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="island-kicker">Editorial</p>
            <h2 className="display-title mt-3 text-4xl font-extrabold text-foreground sm:text-5xl uppercase tracking-tighter">
              Featured Articles
            </h2>
          </div>
          <Link
            to="/blog"
            search={{ q: "" }}
            className="group flex items-center gap-1.5 text-sm font-black text-primary no-underline uppercase tracking-widest"
          >
            Full Archive
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 transition-[transform,opacity] group-hover:translate-x-1"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {latestPosts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="island-shell rounded-3xl p-12 text-center">
            <p className="text-(--sea-ink-soft)">
              No posts yet. Run the seed command to create your first 5
              articles.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
