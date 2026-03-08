import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { isRegistrationLocked } from '#/lib/registration'

const getRegistrationStatus = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    locked: await isRegistrationLocked(),
  }
})

export const Route = createFileRoute('/demo/better-auth')({
  head: () => ({
    meta: [
      { title: 'Admin Access | PlayfulPulse' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  loader: () => getRegistrationStatus(),
  component: BetterAuthDemo,
})

function BetterAuthDemo() {
  const registrationState = Route.useLoaderData()
  const { data: session, isPending } = authClient.useSession()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [registrationLocked, setRegistrationLocked] = useState(
    registrationState.locked,
  )

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (mode === 'sign-up') {
        if (registrationLocked) {
          setMessage('Registration is closed. Sign in with the existing account.')
          return
        }

        await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || 'Admin',
        })
        setRegistrationLocked(true)
        setMode('sign-in')
        setMessage('Account created. Registration is now closed.')
      } else {
        await authClient.signIn.email({
          email: email.trim(),
          password,
        })
        setMessage('Signed in successfully.')
      }
    } catch {
      if (mode === 'sign-up') {
        setRegistrationLocked(true)
        setMessage('Registration is closed. Sign in with the existing account.')
      } else {
        setMessage('Authentication failed. Check your credentials and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-20 pt-14">
      <section className="island-shell clip-sash rounded-[2rem] p-8 text-center sm:p-10">
        <p className="island-kicker mb-4">Authentication</p>
        <h1 className="display-title text-5xl text-(--sea-ink) sm:text-6xl">Admin Access</h1>
        <p className="mx-auto mt-4 max-w-2xl text-(--sea-ink-soft)">
          Sign in with Better Auth to access the dashboard.
        </p>
      </section>

      {isPending ? (
        <p className="mt-8 text-sm text-(--sea-ink-soft)">Loading…</p>
      ) : session?.user ? (
        <section className="island-shell mt-8 rounded-[1.6rem] p-6 sm:p-8">
          <h2 className="display-title text-3xl text-(--sea-ink)">Session Active</h2>
          <p className="mt-3 break-words text-sm text-(--sea-ink-soft)">
            Signed in as: {session.user.email}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-full bg-(--lagoon-deep) px-6 py-3 text-sm font-bold text-primary-foreground no-underline transition-[transform,opacity] hover:-translate-y-0.5"
            >
              Open Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void authClient.signOut()}
              className="rounded-full border border-(--line) bg-(--chip-bg) px-6 py-3 text-sm font-bold text-(--sea-ink) transition-[transform,opacity] hover:-translate-y-0.5"
            >
              Sign Out
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="island-shell mt-8 rounded-[1.6rem] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('sign-in')}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                mode === 'sign-in'
                  ? 'bg-(--lagoon-deep) text-primary-foreground'
                  : 'border border-(--line) bg-(--chip-bg) text-(--sea-ink)'
              }`}
            >
              Sign In
            </button>
            {!registrationLocked ? (
              <button
                type="button"
                onClick={() => setMode('sign-up')}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                  mode === 'sign-up'
                    ? 'bg-(--lagoon-deep) text-primary-foreground'
                    : 'border border-(--line) bg-(--chip-bg) text-(--sea-ink)'
                }`}
              >
                Sign Up
              </button>
            ) : null}
          </div>

          {mode === 'sign-up' ? (
            <div className="mb-4">
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Your name…"
                className="w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
              />
            </div>
          ) : null}

          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="admin@yourdomain.com…"
              className="w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-(--sea-ink)">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="At least 8 characters…"
              className="w-full rounded-xl border border-(--input) bg-(--chip-bg) px-4 py-3 text-sm text-(--sea-ink)"
            />
          </div>

          {message ? (
            <p className="mt-4 text-sm text-(--sea-ink-soft)" aria-live="polite">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-full bg-(--lagoon-deep) px-6 py-3 text-sm font-bold text-primary-foreground transition-[transform,opacity] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Loading…' : mode === 'sign-up' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      )}
    </main>
  )
}
