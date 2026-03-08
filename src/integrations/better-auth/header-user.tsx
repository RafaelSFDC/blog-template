import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full border-2 border-white bg-(--chip-bg)" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img src={session.user.image} alt="" className="h-9 w-9 rounded-full border-2 border-white" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-mint">
            <span className="text-xs font-bold text-ink">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            void authClient.signOut()
          }}
          className="toy-button h-10 rounded-2xl border-4 border-white bg-coral px-4 text-sm font-black text-white shadow-toy"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <Link
      to="/demo/better-auth"
      className="toy-button inline-flex h-10 items-center rounded-2xl border-4 border-white bg-mint px-4 text-sm font-black text-ink shadow-toy"
    >
      Sign in
    </Link>
  )
}
