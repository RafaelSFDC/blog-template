import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { requireAdminSession } from '#/lib/admin-auth'
import { TiptapEditor } from '#/components/tiptap-editor'

interface PostFormInput {
  title: string
  slug: string
  excerpt: string
  content: string
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
}

const createPost = createServerFn({ method: 'POST' })
  .inputValidator((input: PostFormInput) => input)
  .handler(async ({ data }) => {
    const session = await requireAdminSession()

    const created = await db
      .insert(posts)
      .values({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogImage: data.ogImage,
        authorId: session.user.id,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: posts.id })

    return created[0]
  })

export const Route = createFileRoute('/dashboard/posts/new')({
  component: NewPostPage,
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function NewPostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [ogImage, setOgImage] = useState('')
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
      setErrorMessage('')
      setSaving(true)
      await createPost({
        data: {
          title: title.trim(),
          slug: normalizedSlug,
          excerpt: excerpt.trim(),
          content: content.trim(),
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          ogImage: ogImage.trim() || undefined,
        },
      })
      await navigate({ to: '/dashboard' })
    } catch {
      setErrorMessage('Could not create this post. Check the slug and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell rounded-4xl p-8 sm:p-10">
        <p className="island-kicker mb-4">Editorial Dashboard</p>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl">Write New Post</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Draft and publish directly from your control panel.
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
            onChange={(event) => {
              const nextTitle = event.currentTarget.value
              setTitle(nextTitle)
              if (!slug) {
                setSlug(slugify(nextTitle))
              }
            }}
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
            {saving ? 'Saving…' : 'Publish Post'}
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
