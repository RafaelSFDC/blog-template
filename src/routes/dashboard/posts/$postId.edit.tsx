import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { createServerFn } from '@tanstack/react-start'
import { posts } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { useState, type FormEvent } from 'react'
import { requireAdminSession } from '#/lib/admin-auth'
import { TiptapEditor } from '#/components/tiptap-editor'

import { triggerWebhook } from '#/lib/webhooks'

interface PostFormInput {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  isPremium: boolean
  status: 'draft' | 'published' | 'scheduled' | 'private'
  publishedAt?: Date
}

const getPostForEdit = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.id),
    })

    if (!post) {
      throw notFound()
    }

    return post
  })

const updatePost = createServerFn({ method: 'POST' })
  .inputValidator((input: PostFormInput) => input)
  .handler(async ({ data }) => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    await db
      .update(posts)
      .set({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        isPremium: data.isPremium,
        status: data.status,
        publishedAt: data.publishedAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, data.id))

    if (data.status === 'published') {
      await triggerWebhook('post.published', {
        id: data.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
      })
    }

    return { ok: true as const }
  })

export const Route = createFileRoute('/dashboard/posts/$postId/edit')({
  loader: ({ params }) => {
    const id = Number(params.postId)
    if (!Number.isFinite(id)) {
      throw notFound()
    }
    return getPostForEdit({ data: { id } })
  },
  component: EditPostPage,
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function EditPostPage() {
  const post = Route.useLoaderData()
  const navigate = useNavigate()
  const [title, setTitle] = useState(post.title)
  const [slug, setSlug] = useState(post.slug)
  const [excerpt, setExcerpt] = useState(post.excerpt)
  const [content, setContent] = useState(post.content)
  const [metaTitle, setMetaTitle] = useState(post.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(post.metaDescription || '')
  const [ogImage, setOgImage] = useState(post.ogImage || '')
  const [isPremium, setIsPremium] = useState(post.isPremium || false)
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'private'>(post.status as any)
  const [publishedAt, setPublishedAt] = useState<string>(
    post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  )
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSEO, setShowSEO] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedSlug = slugify(slug || title)
    if (!normalizedSlug) {
      setErrorMessage('Add a title or slug so the post URL can be generated.')
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      await updatePost({
        data: {
          id: post.id,
          title: title.trim(),
          slug: normalizedSlug,
          excerpt: excerpt.trim(),
          content: content.trim(),
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          ogImage: ogImage.trim() || undefined,
          isPremium,
          status,
          publishedAt: status === 'scheduled' ? new Date(publishedAt) : (status === 'published' ? new Date() : undefined),
        },
      })
      await navigate({ to: '/dashboard' })
    } catch (e) {
      console.error(e)
      setErrorMessage('Could not update this post. Check the slug and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell rounded-4xl p-8 sm:p-10">
        <p className="island-kicker mb-4">Editorial Dashboard</p>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl">Edit Post</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Refine the story and keep your publication up to date.
        </p>
      </section>

      <form onSubmit={onSubmit} className="island-shell mt-8 space-y-6 rounded-[1.6rem] p-6 sm:p-8">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            autoComplete="off"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Designing A Better Publishing Workflow…"
            className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-semibold text-foreground">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            value={slug}
            onChange={(event) => setSlug(slugify(event.currentTarget.value))}
            placeholder="designing-a-better-publishing-workflow…"
            className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold text-foreground">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            required
            value={excerpt}
            onChange={(event) => setExcerpt(event.currentTarget.value)}
            placeholder="Summarize the key argument of this post in 1 short paragraph…"
            className="min-h-28 w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label htmlFor="content" className="mb-2 block text-sm font-semibold text-foreground">
            Content
          </label>
          <TiptapEditor 
            content={content} 
            onChange={setContent} 
          />
        </div>

        <div className="border-t border-border pt-6">
          <button
            type="button"
            onClick={() => setShowSEO(!showSEO)}
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-80"
          >
            {showSEO ? '▼' : '▶'} SEO Settings
          </button>
          
          {showSEO && (
            <div className="mt-4 space-y-4 rounded-xl bg-muted/50 p-6">
              <div>
                <label htmlFor="metaTitle" className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Meta Title (Google Title)
                </label>
                <input
                  id="metaTitle"
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Se ometido, usará o título do post"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="metaDescription" className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Descrição curta para os resultados de busca..."
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ogImage" className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  OG Image URL
                </label>
                <input
                  id="ogImage"
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-semibold text-foreground">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
            >
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="private">Private</option>
            </select>
          </div>

          {status === 'scheduled' && (
            <div>
              <label htmlFor="publishedAt" className="mb-2 block text-sm font-semibold text-foreground">
                Publication Date
              </label>
              <input
                id="publishedAt"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <input
            id="isPremium"
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
            className="h-5 w-5 rounded border-primary bg-background text-primary focus:ring-primary"
          />
          <label htmlFor="isPremium" className="flex flex-col cursor-pointer">
            <span className="text-sm font-bold text-foreground">Post Premium</span>
            <span className="text-xs text-muted-foreground">Somente assinantes pagos poderão ler o conteúdo completo.</span>
          </label>
        </div>

        {errorMessage ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={saving}
            variant="zine"
            size="lg"
            className="rounded-full"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="zine-outline"
            size="lg"
            onClick={() => void navigate({ to: '/dashboard' })}
            className="rounded-full"
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  )
}
