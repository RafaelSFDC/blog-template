import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { useState, type FormEvent } from 'react'
import { requireAdminSession } from '#/lib/admin-auth'
import { TiptapEditor } from '#/components/tiptap-editor'

interface PostFormInput {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
}

const getPostForEdit = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession()

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

    await db
      .update(posts)
      .set({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, data.id))

    return { ok: true as const }
  })

export const Route = createFileRoute('/dashboard/$postId/edit')({
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
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
        },
      })
      await navigate({ to: '/dashboard' })
    } catch {
      setErrorMessage('Could not update this post. Check the slug and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell rounded-4xl p-8 sm:p-10">
        <p className="island-kicker mb-4">Editorial Dashboard</p>
        <h1 className="display-title text-5xl text-(--sea-ink) sm:text-6xl">Edit Post</h1>
        <p className="mt-3 max-w-2xl text-(--sea-ink-soft)">
          Refine the story and keep your publication up to date.
        </p>
      </section>

      <form onSubmit={onSubmit} className="island-shell mt-8 space-y-6 rounded-[1.6rem] p-6 sm:p-8">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
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
            className="w-full rounded-xl border border-input bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
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
            className="w-full rounded-xl border border-input bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            required
            value={excerpt}
            onChange={(event) => setExcerpt(event.currentTarget.value)}
            placeholder="Summarize the key argument of this post in 1 short paragraph…"
            className="min-h-28 w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
          />
        </div>

        <div>
          <label htmlFor="content" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
            Content
          </label>
          <TiptapEditor 
            content={content} 
            onChange={setContent} 
          />
        </div>

        {errorMessage ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-(--lagoon-deep) px-6 py-3 text-sm font-bold text-primary-foreground transition-[transform,opacity] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => void navigate({ to: '/dashboard' })}
            className="rounded-full border border-(--line) bg-(--chip-bg) px-6 py-3 text-sm font-bold text-(--sea-ink) transition-[transform,opacity] hover:-translate-y-0.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
