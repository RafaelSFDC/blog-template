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
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--hero-a),transparent_66%)] opacity-50" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--hero-b),transparent_66%)] opacity-50" />
        
        <div className="relative z-10">
          <p className="island-kicker mb-4">Open Source Blog Template</p>
          <h1 className="display-title mb-6 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-(--sea-ink) sm:text-7xl">
            Insights for the <span className="text-(--lagoon-deep)">Modern Web</span> developer.
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-(--sea-ink-soft) sm:text-xl">
            A premium, high-performance blog template built with TanStack Start, 
            Drizzle ORM, and Tailwind CSS. Start sharing your ideas in minutes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/blog"
              className="rounded-full bg-(--lagoon-deep) px-7 py-3.5 text-base font-bold text-white no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-(--sea-ink) hover:shadow-xl"
            >
              Expose latest posts
            </Link>
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-(--line) bg-white/40 px-7 py-3.5 text-base font-bold text-(--sea-ink) no-underline backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/60"
            >
              Clone Template
            </a>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="display-title text-3xl font-bold text-(--sea-ink) sm:text-4xl">
              Featured Articles
            </h2>
            <p className="mt-2 text-(--sea-ink-soft)">Hand-picked stories for you.</p>
          </div>
          <Link
            to="/blog"
            className="group flex items-center gap-1.5 text-sm font-bold text-(--lagoon-deep) no-underline"
          >
            View all posts
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-1">
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
            <p className="text-(--sea-ink-soft)">No posts found. Start by adding one in the admin panel!</p>
          </div>
        )}
      </section>

      <section className="mt-20 rounded-[2.5rem] bg-(--sea-ink) p-8 text-white sm:p-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="display-title mb-6 text-4xl font-bold sm:text-5xl">
            Built for speed and performance.
          </h2>
          <p className="text-lg text-(--sea-ink-soft) opacity-80 sm:text-xl">
            Leveraging TanStack Start's SSR and streaming capabilities to deliver 
            instant page loads and a seamless reading experience.
          </p>
        </div>
      </section>
    </main>
  )
}

