import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full border-2 border-border bg-muted" />
    )
  }

  if (session?.user) {
    return (
      <Link to="/dashboard" className="transition-transform hover:scale-105 active:scale-95">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-9 w-9 rounded-full border-2 border-border shadow-zine-sm ring-primary/20 ring-offset-2 hover:ring-2"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-primary shadow-zine-sm ring-primary/20 ring-offset-2 hover:ring-2">
            <span className="text-xs font-black text-white">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
      </Link>
    )
  }

  return (
    <Button asChild variant="zine-secondary" size="sm">
      <Link to="/auth/login" className="no-underline">
        Sign in
      </Link>
    </Button>
  )
}
