import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/dashboard/Header'
import { DashboardPageContainer } from '#/components/dashboard/DashboardPageContainer'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { comments, posts } from '#/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Check, X, Trash2, MessageSquare } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { requireAdminSession } from '#/lib/admin-auth'

const getComments = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession()
  return await db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      authorEmail: comments.authorEmail,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      postTitle: posts.title,
      postId: posts.id,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))
})

const updateCommentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; status: "approved" | "spam" | "pending" }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.update(comments).set({ status: data.status }).where(eq(comments.id, data.id))
    return { success: true }
  })

const deleteComment = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession()
    await db.delete(comments).where(eq(comments.id, id))
    return { success: true }
  })

export const Route = createFileRoute('/dashboard/comments/')({
  loader: () => getComments(),
  component: CommentsPage,
})

function CommentsPage() {
  const commentsList = Route.useLoaderData()
  const navigate = useNavigate()

  async function handleStatus(id: number, status: "approved" | "spam" | "pending") {
    await updateCommentStatus({ data: { id, status } })
    navigate({ to: '.' }) // Refresh
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return
    await deleteComment({ data: id })
    navigate({ to: '.' }) // Refresh
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Comments"
        description="Moderate discussions and manage feedback across your publication."
        icon={MessageSquare}
        iconLabel="Community Management"
      />

      <div className="grid gap-6">
        {commentsList.length > 0 ? (
          commentsList.map((comment: any) => (
            <div 
              key={comment.id} 
              className="island-shell rounded-2xl bg-card p-6 border-2 border-border/10 hover:border-border transition-colors group"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground uppercase tracking-wider text-sm">
                      {comment.authorName}
                    </span>
                    <Badge variant={comment.status === 'approved' ? 'default' : comment.status === 'spam' ? 'destructive' : 'outline'}>
                      {comment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    on <span className="text-primary italic">"{comment.postTitle}"</span> • {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-foreground leading-relaxed mt-3 border-l-3 border-primary/20 pl-4 py-1 italic">
                    "{comment.content}"
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                  {comment.status !== 'approved' && (
                    <Button 
                      size="sm" 
                      variant="zine" 
                      onClick={() => handleStatus(comment.id, 'approved')}
                      title="Approve"
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  {comment.status !== 'spam' && (
                    <Button 
                      size="sm" 
                      variant="zine-outline" 
                      onClick={() => handleStatus(comment.id, 'spam')}
                      title="Mark as Spam"
                    >
                      <X size={16} />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(comment.id)}
                    className="border-2 border-destructive/20"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="island-shell rounded-3xl p-20 text-center border-3 border-dashed border-border/20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-black text-foreground uppercase">No comments yet</h2>
            <p className="text-muted-foreground font-bold mt-2">When readers participate, their thoughts will appear here.</p>
          </div>
        )}
      </div>
    </DashboardPageContainer>
  )
}
