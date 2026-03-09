import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { desc, eq } from 'drizzle-orm'
import { useState } from 'react'
import { useRouter, useLoaderData } from '@tanstack/react-router'
import { requireAdminSession } from '#/lib/admin-auth'
import { Plus, Eye, Pencil, Trash2, FileText, Download } from 'lucide-react'

type DashboardPost = typeof posts.$inferSelect

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

export const Route = createFileRoute('/dashboard/posts/')({
  loader: () => getDashboardPosts(),
  component: PostsManagementPage,
})

function PostsManagementPage() {
  const postList = useLoaderData({ from: '/dashboard/posts/' })
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
    <div className="space-y-8">
      <header className="island-shell flex flex-wrap items-end justify-between gap-6 rounded-3xl p-8 sm:p-10">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            <FileText size={20} strokeWidth={3} />
            <p className="island-kicker mb-0">Content Library</p>
          </div>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl">Manage Posts</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
            Create drafts, edit published articles, and maintain your blog archive.
          </p>
        </div>
        <Button asChild variant="zine" size="lg" className="rounded-xl h-14 px-8 shadow-zine-sm">
          <Link to="/dashboard/posts/new" className="flex items-center gap-2 no-underline">
            <Plus size={20} strokeWidth={3} />
            <span className="uppercase tracking-widest font-black">New Post</span>
          </Link>
        </Button>
      </header>

      {errorMessage ? (
        <div className="rounded-xl border-3 border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-bold text-destructive flex items-center gap-3">
          <Trash2 size={18} />
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4">
        {postList.length > 0 ? (
          postList.map((post: DashboardPost) => (
            <article key={post.id} className="island-shell hover:border-primary/30 transition-all group overflow-hidden rounded-2xl p-5 sm:p-6 bg-card border-3 border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={post.publishedAt ? "rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-green-600 border border-green-500/20" : "rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-500/20"}>
                      {post.publishedAt ? 'Published' : 'Draft'}
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      {post.publishedAt ? dateFormatter.format(new Date(post.publishedAt)) : 'Last updated ' + dateFormatter.format(new Date(post.updatedAt || Date.now()))}
                    </p>
                  </div>
                  <h2 className="display-title wrap-break-word text-2xl text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {post.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">/{post.slug}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="zine-outline" size="sm" className="rounded-lg h-10 border-2 hover:border-primary hover:text-primary transition-all">
                    <Link to="/blog/$slug" params={{ slug: post.slug }} className="no-underline flex items-center gap-2">
                      <Eye size={16} />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </Button>
                  <Button asChild variant="zine-outline" size="sm" className="rounded-lg h-10 border-2 hover:border-primary hover:text-primary transition-all">
                    <Link to="/dashboard/posts/$postId/edit" params={{ postId: String(post.id) }} className="no-underline flex items-center gap-2">
                      <Pencil size={16} />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="rounded-lg h-10 bg-destructive/5 text-destructive border-2 border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                    <span className="ml-2 hidden sm:inline">{deletingId === post.id ? 'Deleting…' : 'Delete'}</span>
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="island-shell rounded-3xl p-20 text-center border-3 border-dashed border-border/50">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Plus size={32} />
            </div>
            <h2 className="display-title text-3xl text-foreground">No Stories Shared Yet</h2>
            <p className="mt-3 text-muted-foreground font-medium">
              Your content archive is empty. Begin your blog journey by creating your first post.
            </p>
            <Button asChild variant="zine" className="mt-8 rounded-xl h-12 px-8">
              <Link to="/dashboard/posts/new" className="no-underline uppercase tracking-widest font-black">
                Create First Post
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
