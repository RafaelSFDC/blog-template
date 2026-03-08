import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { desc } from 'drizzle-orm'
import { PostCard } from '#/components/blog/PostCard'
import { useMemo, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

const getLatestPosts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(12)
  })

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
  }),
  loader: () => getLatestPosts(),
  head: (ctx: any) => {
    const search = ctx.search as { q: string }
    const hasQuery = search.q.trim().length > 0
    return {
      meta: [
        {
          title: hasQuery
            ? `Search "${search.q}" | VibeZine`
            : 'All Stories | VibeZine Blog',
        },
        {
          name: 'description',
          content: hasQuery
            ? `Search results for "${search.q}" in VibeZine stories.`
            : 'Browse all articles on design, tech, and cultural experiments.',
        },
      ],
    }
  },
  component: BlogIndex,
})

function BlogIndex() {
  const latestPosts = Route.useLoaderData()
  const { q } = Route.useSearch()
  const query = q.trim().toLowerCase()
  const [email, setEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')

  const filteredPosts = useMemo(() => {
    if (!query) {
      return latestPosts
    }

    return latestPosts.filter((post: any) => {
      const title = String(post.title || '').toLowerCase()
      const excerpt = String(post.excerpt || '').toLowerCase()
      return title.includes(query) || excerpt.includes(query)
    })
  }, [latestPosts, query])

  function onSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

    if (!isValid) {
      setNewsletterMessage('Please provide a valid email address.')
      return
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('newsletterEmail', normalizedEmail)
    }

    setNewsletterMessage('Thanks! You are on the list.')
    setEmail('')
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <header className="island-shell mb-8 rounded-lg p-8 sm:p-10">
        <p className="island-kicker mb-3">Vibe Archive</p>
        <h1 className="display-title mb-4 text-5xl text-foreground sm:text-6xl uppercase tracking-tighter font-extrabold">
          All Stories
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground font-bold leading-tight">
          Bold notes on design, cultural code, and aesthetic experiments.
        </p>
      </header>

      <section className="mb-8">
        {query ? (
          <p className="mb-4 text-sm font-semibold text-(--sea-ink-soft)">
            Showing results for "{q}".
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button className="toy-button rounded-lg border-2 border-border bg-accent px-6 py-2 font-black text-foreground shadow-zine-sm sm:border-3">
            ✨ All Stories
          </button>
          <button className="toy-button rounded-lg border-2 border-border bg-secondary px-6 py-2 font-black text-foreground shadow-zine-sm sm:border-3">
            🎨 Design
          </button>
          <button className="toy-button rounded-lg border-2 border-border bg-sky px-6 py-2 font-black text-foreground shadow-zine-sm sm:border-3">
            🚀 Tech
          </button>
          <button className="toy-button rounded-lg border-2 border-border bg-primary px-6 py-2 font-black text-white shadow-zine-sm sm:border-3">
            🧸 Culture
          </button>
          <button className="toy-button rounded-lg border-2 border-border bg-grape px-6 py-2 font-black text-white shadow-zine-sm sm:border-3">
            🍦 Lifestyle
          </button>
        </div>
      </section>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="island-shell flex flex-col items-center justify-center rounded-lg py-20 text-center">
          <div className="mb-4 rounded-lg bg-muted p-4 border-2 border-border">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
            {query ? `Search for "${q}" failed` : 'No stories found'}
          </h2>
          <p className="mt-2 text-muted-foreground font-bold">
            {query
              ? 'Try different keywords or check your spelling.'
              : 'The archive is currently empty.'}
          </p>
        </div>
      )}

      <section className="relative mt-12 overflow-hidden rounded-lg border-4 border-border bg-primary p-8 text-center shadow-zine sm:p-12">
        <h2 className="display-title relative z-10 mb-4 text-4xl text-white sm:text-5xl font-extrabold uppercase tracking-tighter">
          Join the Tribe!
        </h2>
        <p className="relative z-10 mx-auto mb-7 max-w-xl text-white/90 font-bold">
          No noise. Just high-energy design drops and creative insights every Sunday.
        </p>
        <form onSubmit={onSubscribe} className="relative z-10 mx-auto flex max-w-xl flex-col gap-4 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="your@edgy.email"
            required
            className="h-14 flex-1 rounded-lg border-2 border-border bg-white/95 px-6 font-bold text-foreground outline-none focus-visible:ring-4 focus-visible:ring-accent sm:border-3"
          />
          <button type="submit" className="toy-button rounded-lg border-2 border-border bg-accent px-8 py-4 font-black text-foreground shadow-zine-sm sm:border-3">
            Subscribe!
          </button>
        </form>
        {newsletterMessage ? (
          <p className="relative z-10 mt-4 text-sm font-semibold text-white" aria-live="polite">
            {newsletterMessage}
          </p>
        ) : null}
      </section>
    </main>
  )
}

