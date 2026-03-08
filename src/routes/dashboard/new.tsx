import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { requireAdminSession } from '#/lib/admin-auth'

interface PostFormInput {
  title: string
  slug: string
  excerpt: string
  content: string
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
        authorId: session.user.id,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: posts.id })

    return created[0]
  })

export const Route = createFileRoute('/dashboard/new')({
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
      setErrorMessage('')
      setSaving(true)
      await createPost({
        data: {
          title: title.trim(),
          slug: normalizedSlug,
          excerpt: excerpt.trim(),
          content: content.trim(),
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
      <section className="island-shell rounded-[2rem] p-8 sm:p-10">
        <p className="island-kicker mb-4">Editorial Dashboard</p>
        <h1 className="display-title text-5xl text-(--sea-ink) sm:text-6xl">Write New Post</h1>
        <p className="mt-3 max-w-2xl text-(--sea-ink-soft)">
          Draft and publish directly from your control panel.
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
            onChange={(event) => {
              const nextTitle = event.currentTarget.value
              setTitle(nextTitle)
              if (!slug) {
                setSlug(slugify(nextTitle))
              }
            }}
            placeholder="Designing A Better Publishing Workflow…"
            className="w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
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
            className="w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
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
            Content (Markdown)
          </label>
          <textarea
            id="content"
            name="content"
            required
            value={content}
            onChange={(event) => setContent(event.currentTarget.value)}
            placeholder="# Main Idea…"
            className="min-h-72 w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 font-mono text-sm text-(--sea-ink)"
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
            {saving ? 'Saving…' : 'Publish Post'}
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
