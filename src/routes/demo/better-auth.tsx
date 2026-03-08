import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { isRegistrationLocked } from '#/lib/registration'
import { Button } from '#/components/ui/button'

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
      <section className="island-shell clip-sash rounded-4xl p-8 text-center sm:p-10">
        <p className="island-kicker mb-4">Authentication</p>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl">Admin Access</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Sign in with Better Auth to access the dashboard.
        </p>
      </section>

      {isPending ? (
        <p className="mt-8 text-sm text-(--sea-ink-soft)">Loading…</p>
      ) : session?.user ? (
        <section className="island-shell mt-8 rounded-[1.6rem] p-6 sm:p-8">
          <h2 className="display-title text-3xl text-foreground">Session Active</h2>
          <p className="mt-3 wrap-break-word text-sm text-muted-foreground">
            Signed in as: {session.user.email}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="zine" size="lg" className="rounded-full">
              <Link
                to="/dashboard"
                className="no-underline"
              >
                Open Dashboard
              </Link>
            </Button>
            <Button
              type="button"
              variant="zine-outline"
              size="lg"
              onClick={() => void authClient.signOut()}
              className="rounded-full"
            >
              Sign Out
            </Button>
          </div>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="island-shell mt-8 rounded-[1.6rem] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === 'sign-in' ? 'zine' : 'zine-outline'}
              size="sm"
              onClick={() => setMode('sign-in')}
              className="rounded-full uppercase tracking-[0.14em]"
            >
              Sign In
            </Button>
            {!registrationLocked ? (
              <Button
                type="button"
                variant={mode === 'sign-up' ? 'zine' : 'zine-outline'}
                size="sm"
                onClick={() => setMode('sign-up')}
                className="rounded-full uppercase tracking-[0.14em]"
              >
                Sign Up
              </Button>
            ) : null}
          </div>

          {mode === 'sign-up' ? (
            <div className="mb-4">
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">
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
                className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
              />
            </div>
          ) : null}

          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">
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
              className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-foreground">
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
              className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground"
            />
          </div>

          {message ? (
            <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={saving}
            variant="zine"
            size="lg"
            className="mt-6 rounded-full"
          >
            {saving ? 'Loading…' : mode === 'sign-up' ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
      )}
    </main>
  )
}
