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
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img src={session.user.image} alt="" className="h-9 w-9 rounded-full border-2 border-border" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-accent">
            <span className="text-xs font-black text-foreground">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <Button
          variant="zine"
          size="sm"
          onClick={() => {
            void authClient.signOut()
          }}
        >
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <Button asChild variant="zine-secondary" size="sm">
      <Link to="/demo/better-auth" className="no-underline">
        Sign in
      </Link>
    </Button>
  )
}
