import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { desc } from 'drizzle-orm'
import { PostCard } from '#/components/blog/PostCard'
import { useMemo, useState, type FormEvent } from 'react'

const getLatestPosts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await db.select().from(posts).orderBy(desc(posts.publishedAt)).limit(12)
  })

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
  }),
  loader: () => getLatestPosts(),
  head: ({ search }) => {
    const hasQuery = search.q.trim().length > 0
    return {
      meta: [
        {
          title: hasQuery
            ? `Search "${search.q}" | PlayfulPulse`
            : 'All Stories | PlayfulPulse Blog',
        },
        {
          name: 'description',
          content: hasQuery
            ? `Search results for "${search.q}" in PlayfulPulse stories.`
            : 'Browse all articles on design, tech, and creative experiments.',
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
      <header className="island-shell mb-8 rounded-[2.4rem] p-8 sm:p-10">
        <p className="island-kicker mb-3">Playful Archive</p>
        <h1 className="display-title mb-4 text-5xl text-(--sea-ink) sm:text-6xl">
          All Stories
        </h1>
        <p className="max-w-2xl text-lg text-(--sea-ink-soft)">
          Fun notes on design, tech, and creative experiments in a tactile, toy-like interface.
        </p>
      </header>

      <section className="mb-8">
        {query ? (
          <p className="mb-4 text-sm font-semibold text-(--sea-ink-soft)">
            Showing results for "{q}".
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button className="toy-button rounded-full border-4 border-white bg-lemon px-6 py-2 font-bold text-ink shadow-toy">
            ✨ All Stories
          </button>
          <button className="toy-button rounded-full border-4 border-white bg-mint px-6 py-2 font-bold text-ink shadow-toy">
            🎨 Design
          </button>
          <button className="toy-button rounded-full border-4 border-white bg-sky px-6 py-2 font-bold text-ink shadow-toy">
            🚀 Tech
          </button>
          <button className="toy-button rounded-full border-4 border-white bg-coral px-6 py-2 font-bold text-white shadow-toy">
            🧸 Toys
          </button>
          <button className="toy-button rounded-full border-4 border-white bg-grape px-6 py-2 font-bold text-white shadow-toy">
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
        <div className="island-shell flex flex-col items-center justify-center rounded-[2rem] py-20 text-center">
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
          <h2 className="text-xl font-bold text-(--sea-ink)">
            {query ? 'No matching posts' : 'No posts found'}
          </h2>
          <p className="mt-2 text-(--sea-ink-soft)">
            {query
              ? 'Try a different keyword or browse the full archive.'
              : 'Check back later for new content!'}
          </p>
        </div>
      )}

      <section className="relative mt-12 overflow-hidden rounded-[2.8rem] border-8 border-white bg-grape p-8 text-center shadow-toy sm:p-12">
        <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-white/10" />
        <h2 className="display-title relative z-10 mb-4 text-4xl text-white sm:text-5xl">
          Get the Fun in your Inbox!
        </h2>
        <p className="relative z-10 mx-auto mb-7 max-w-xl text-white/85">
          No boring emails, just playful UI inspiration and practical notes every week.
        </p>
        <form onSubmit={onSubscribe} className="relative z-10 mx-auto flex max-w-xl flex-col gap-4 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="your@happy.email"
            required
            className="h-14 flex-1 rounded-3xl border-4 border-white bg-white/90 px-6 font-bold text-ink shadow-inner-soft outline-none focus-visible:ring-4 focus-visible:ring-lemon"
          />
          <button type="submit" className="toy-button rounded-3xl border-4 border-white bg-lemon px-8 py-4 font-black text-ink shadow-toy">
            Join the Club!
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

