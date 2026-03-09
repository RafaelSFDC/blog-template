import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
// Returns {ok: false, reason} instead of throwing, so the outer catch
// doesn't swallow legitimate redirect errors causing an infinite loop.
const checkDashboardAccess = createServerFn({ method: 'GET' }).handler(async () => {
  const { getDashboardSession } = await import('#/lib/admin-auth')
  return getDashboardSession()
})

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  beforeLoad: async () => {
    const result = await checkDashboardAccess()
    if (!result.ok) {
      throw redirect({
        to: result.reason === 'unauthenticated' ? '/auth/login' : '/',
      })
    }
  },
  component: DashboardLayout,
})


import { DashboardSidebar } from '#/components/dashboard/Sidebar'

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/25">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
