import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { PostCard } from '@/components/blog/PostCard'

const getLatestPosts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(12)
  })

export const Route = createFileRoute('/blog/')({
  loader: () => getLatestPosts(),
  component: BlogIndex,
})

function BlogIndex() {
  const latestPosts = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <header className="mb-12">
        <h1 className="display-title mb-4 text-4xl font-bold text-(--sea-ink) sm:text-5xl">
          Latest Posts
        </h1>
        <p className="max-w-2xl text-lg text-(--sea-ink-soft)">
          Discover our latest thoughts, tutorials, and insights on modern web development.
        </p>
      </header>

      {latestPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="island-shell flex flex-col items-center justify-center rounded-2xl py-20 text-center">
          <div className="mb-4 rounded-full bg-(--line) p-4">
            <svg
              className="h-8 w-8 text-(--sea-ink-soft)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM3 17h18"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-(--sea-ink)">No posts found</h2>
          <p className="mt-2 text-(--sea-ink-soft)">
            Check back later for new content!
          </p>
        </div>
      )}
    </main>
  )
}
