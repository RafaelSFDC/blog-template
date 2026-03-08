import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { requireAdminSession } from '#/lib/admin-auth'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

const getDashboardPosts = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  return await db.select().from(posts).orderBy(desc(posts.updatedAt), desc(posts.publishedAt))
})

const deletePost = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.delete(posts).where(eq(posts.id, data.id))
    return { ok: true as const }
  })

export const Route = createFileRoute('/dashboard/')({
  loader: () => getDashboardPosts(),
  component: DashboardPage,
})

function DashboardPage() {
  const postList = Route.useLoaderData()
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this post? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    try {
      setErrorMessage('')
      setDeletingId(id)
      await deletePost({ data: { id } })
      await router.invalidate()
    } catch {
      setErrorMessage('Could not delete the post. Try again in a few seconds.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell clip-sash rounded-[2rem] p-8 sm:p-10">
        <p className="island-kicker mb-4">Editorial Dashboard</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display-title text-5xl text-(--sea-ink) sm:text-6xl">Manage Posts</h1>
            <p className="mt-3 max-w-2xl text-(--sea-ink-soft)">
              Create drafts, edit published posts, and maintain your blog archive.
            </p>
          </div>
          <Link
            to="/dashboard/new"
            className="rounded-full bg-(--lagoon-deep) px-6 py-3 text-sm font-bold text-primary-foreground no-underline transition-[transform,opacity] hover:-translate-y-0.5"
          >
            New Post
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <section className="mt-8 space-y-4">
        {postList.length > 0 ? (
          postList.map((post) => (
            <article key={post.id} className="island-shell rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--sea-ink-soft)">
                    {post.publishedAt ? dateFormatter.format(new Date(post.publishedAt)) : 'Draft'}
                  </p>
                  <h2 className="display-title mt-2 break-words text-3xl text-(--sea-ink)">
                    {post.title}
                  </h2>
                  <p className="mt-2 break-words text-sm text-(--sea-ink-soft)">/{post.slug}</p>
                  <p className="mt-4 line-clamp-2 text-sm text-(--sea-ink-soft)">{post.excerpt}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="rounded-full border border-(--line) bg-(--chip-bg) px-4 py-2 text-xs font-bold text-(--sea-ink) no-underline transition-[transform,opacity] hover:-translate-y-0.5"
                  >
                    View
                  </Link>
                  <Link
                    to="/dashboard/$postId/edit"
                    params={{ postId: String(post.id) }}
                    className="rounded-full border border-(--line) bg-(--chip-bg) px-4 py-2 text-xs font-bold text-(--sea-ink) no-underline transition-[transform,opacity] hover:-translate-y-0.5"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive transition-[transform,opacity] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === post.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="island-shell rounded-2xl p-10 text-center">
            <h2 className="display-title text-3xl text-(--sea-ink)">No Posts Yet</h2>
            <p className="mt-3 text-sm text-(--sea-ink-soft)">
              Start by creating your first post from this dashboard.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
