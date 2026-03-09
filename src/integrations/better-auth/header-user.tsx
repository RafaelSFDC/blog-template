import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { LayoutDashboard, LogOut, Settings } from 'lucide-react'

const DASHBOARD_ROLES = ['author', 'editor', 'moderator', 'admin', 'super-admin']

export default function BetterAuthHeader() {
  const queryClient = useQueryClient()
  const { data: session, isPending } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await authClient.getSession()
      return res.data
    },
    retry: 3,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (isPending) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full border-2 border-border bg-muted" />
    )
  }

  if (session?.user) {
    const hasDashboardAccess = DASHBOARD_ROLES.includes(session.user.role as string)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="transition-transform hover:scale-105 active:scale-95 outline-none">
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
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-2 island-shell border-2">
          <DropdownMenuLabel className="font-black uppercase tracking-widest text-xs px-3 py-2">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {hasDashboardAccess && (
            <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer font-bold">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer font-bold">
            <Link to="/account">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['session'] })
                    window.location.href = '/'
                  },
                },
              })
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
