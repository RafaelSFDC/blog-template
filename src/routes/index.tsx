import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { desc } from 'drizzle-orm'
import { PostCard } from '#/components/blog/PostCard'

const getTopPosts = createServerFn({ method: 'GET' }).handler(async () => {
  return await db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(3)
})

export const Route = createFileRoute('/')({ 
  loader: () => getTopPosts(),
  component: Home 
})

function Home() {
  const latestPosts: any[] = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="editorial-grid rise-in">
        <div className="island-shell clip-sash col-span-12 overflow-hidden rounded-[2.4rem] p-8 sm:p-10 lg:col-span-8 lg:p-12">
          <p className="island-kicker mb-5">Open Source Publication System</p>
          <h1 className="display-title headline-fluid mb-6 max-w-4xl text-(--sea-ink)">
            Publish Sharp Ideas With A Visual Signature.
          </h1>
          <p className="subhead-fluid max-w-2xl text-(--sea-ink-soft)">
            Build a serious editorial presence with fast server rendering, typed data, and a design language that looks handcrafted.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/blog"
              className="rounded-full bg-(--lagoon-deep) px-7 py-3.5 text-base font-bold text-primary-foreground no-underline shadow-[0_16px_34px_oklch(0.56_0.18_36/32%)] transition-[transform,opacity] hover:-translate-y-0.5"
            >
              Browse Articles
            </Link>
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-(--line) bg-(--chip-bg) px-7 py-3.5 text-base font-bold text-(--sea-ink) no-underline transition-[transform,opacity] hover:-translate-y-0.5"
            >
              Launch Your Copy
            </a>
          </div>
        </div>

        <aside className="island-shell reveal-card col-span-12 rounded-[1.8rem] p-7 lg:col-span-4">
          <p className="island-kicker mb-4">Signal Snapshot</p>
          <dl className="space-y-5">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-(--sea-ink-soft)">Runtime</dt>
              <dd className="display-title mt-1 text-3xl text-(--sea-ink)">TanStack Start</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-(--sea-ink-soft)">Data Layer</dt>
              <dd className="display-title mt-1 text-3xl text-(--sea-ink)">Drizzle + SQLite</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-(--sea-ink-soft)">Articles</dt>
              <dd className="display-title mt-1 text-3xl text-(--sea-ink)">{latestPosts.length}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mt-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="island-kicker">Selected Stories</p>
            <h2 className="display-title mt-3 text-4xl font-bold text-(--sea-ink) sm:text-5xl">
              Featured Articles
            </h2>
          </div>
          <Link
            to="/blog"
            className="group flex items-center gap-1.5 text-sm font-bold text-(--lagoon-deep) no-underline"
          >
            See Full Archive
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-[transform,opacity] group-hover:translate-x-1">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
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
            <p className="text-(--sea-ink-soft)">No posts yet. Run the seed command to create your first 5 articles.</p>
          </div>
        )}
      </section>
    </main>
  )
}

