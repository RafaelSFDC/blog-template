import { Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = query.trim()
    await navigate({
      to: '/blog',
      search: q ? { q } : {},
    })
  }

  return (
    <header className="sticky top-0 z-50 px-4 py-4 backdrop-blur-xl">
      <nav className="page-wrap island-shell rounded-[2rem] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-3 self-start no-underline"
          >
            <span className="flex h-12 w-12 -rotate-3 items-center justify-center rounded-2xl border-4 border-white bg-coral text-2xl font-black text-white shadow-toy">
              P.
            </span>
            <span className="display-title text-3xl text-ink">
              Playful<span className="text-coral">Pulse</span>
            </span>
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={onSearch} className="w-full sm:w-72">
              <label className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M21 21l-4.4-4.4m1.4-5.1a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                  </svg>
                </span>
                <input
                  type="search"
                  aria-label="Search posts"
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search stories..."
                  className="h-12 w-full rounded-full border-4 border-white bg-white/80 pl-11 pr-4 text-sm font-semibold text-(--sea-ink) shadow-inner-soft outline-none focus-visible:ring-4 focus-visible:ring-mint"
                />
              </label>
            </form>

            <div className="flex items-center gap-2">
              <Link
                to="/demo/better-auth"
                className="toy-button inline-flex h-11 items-center rounded-2xl border-4 border-white bg-mint px-5 text-sm font-black text-ink shadow-toy no-underline"
              >
                Login
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
              Home
            </Link>
            <Link to="/blog" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
              Stories
            </Link>
            <Link to="/about" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
              About
            </Link>
            <Link to="/dashboard" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
              Dashboard
            </Link>
            <BetterAuthHeader />
          </div>
        </div>
      </nav>
    </header>
  )
}
