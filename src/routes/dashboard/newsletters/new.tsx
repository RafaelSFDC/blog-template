import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { newsletters } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { useState, type FormEvent } from 'react'
import { requireAdminSession } from '#/lib/admin-auth'
import { TiptapEditor } from '#/components/tiptap-editor'
import { sendNewsletter } from '#/lib/newsletter'
import { ChevronLeft, Info, Send } from 'lucide-react'
import { format } from 'date-fns'

const saveAndSendNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((input: { subject: string; content: string; postId?: number; sendNow: boolean }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession()

    const [created] = await db
      .insert(newsletters)
      .values({
        subject: data.subject,
        content: data.content,
        postId: data.postId,
        status: data.sendNow ? 'sending' : 'draft',
      })
      .returning({ id: newsletters.id })

    if (data.sendNow) {
       // In a real app, this should be an async background task
       // For now, we call it and wait (might timeout on serverless)
       try {
         await sendNewsletter(created.id)
       } catch (err) {
         console.error('Failed to send newsletter:', err)
       }
    }

    return created
  })

const getPostsForTemplate = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    return db.query.posts.findMany({
      orderBy: (p: any, { desc }: any) => [desc(p.publishedAt)],
      limit: 10,
    })
  })

const getNewsletterById = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession();
    return db.query.newsletters.findFirst({
      where: eq(newsletters.id, id),
    });
  });

export const Route = createFileRoute('/dashboard/newsletters/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    fromId: search.fromId ? Number(search.fromId) : undefined,
  }),
  loader: async (ctx: any) => {
    const { search } = ctx
    const posts = await getPostsForTemplate()
    let existing = null
    if (search.fromId) {
       existing = await getNewsletterById({ data: search.fromId })
    }
    return { posts, existing }
  },
  component: NewNewsletterPage,
})

function NewNewsletterPage() {
  const { posts: recentPosts, existing } = Route.useLoaderData()
  const navigate = useNavigate()
  const [subject, setSubject] = useState(existing?.subject || '')
  const [content, setContent] = useState(existing?.content || '')
  const [saving, setSaving] = useState(false)
  const [postId, setPostId] = useState<number | undefined>(existing?.postId || undefined)
  const [errorMessage, setErrorMessage] = useState('')

  const handlePostTemplate = (pId: number) => {
    const post = recentPosts.find((p: any) => p.id === pId)
    if (post) {
      setSubject(`New post: ${post.title}`)
      setContent(`<h2>${post.title}</h2><p>${post.excerpt}</p><a href="/blog/${post.slug}">Read more</a>`)
      setPostId(pId)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>, sendNow: boolean) {
    event.preventDefault()
    if (!subject || !content) {
      setErrorMessage('Subject and Content are required.')
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      await saveAndSendNewsletter({
        data: { subject, content, postId, sendNow }
      })
      await navigate({ to: '/dashboard/newsletters' })
    } catch (err) {
      setErrorMessage('Failed to save newsletter campaign.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="-ml-3 rounded-full text-muted-foreground hover:text-foreground">
           <button onClick={() => window.history.back()} className="flex items-center gap-1">
             <ChevronLeft className="h-4 w-4" />
             Back to Campaigns
           </button>
        </Button>
      </div>

      <section className="bg-card border shadow-sm rounded-xl p-8 sm:p-10">
        <p className="island-kicker mb-4">Composer</p>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl">New Campaign</h1>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form className="bg-card border shadow-sm space-y-6 rounded-[1.6rem] p-6 sm:p-8">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Email Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Check out our latest news…"
                className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Email Body</label>
              <TiptapEditor content={content} onChange={setContent} />
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Button
                type="button"
                disabled={saving}
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={(e) => onSubmit(e as any, true)}
              >
                <Send className="mr-2 h-5 w-5" />
                {saving ? 'Processing…' : 'Save & Send Now'}
              </Button>
              <Button
                type="button"
                disabled={saving}
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={(e) => onSubmit(e as any, false)}
              >
                Save as Draft
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="bg-card border shadow-sm rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Info className="h-5 w-5 text-primary" />
              Use Post as Template
            </h3>
            <div className="space-y-3">
              {recentPosts.map((post: any) => (
                <button
                  key={post.id}
                  onClick={() => handlePostTemplate(post.id)}
                  className="w-full rounded-xl border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  <p className="font-semibold line-clamp-1">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(post.publishedAt!), 'MMM d')}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="border shadow-sm rounded-xl border-primary/20 bg-primary/5 p-6">
            <h3 className="text-lg font-bold">Ready to send?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once sent, we will email all your active subscribers. This action cannot be undone.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
