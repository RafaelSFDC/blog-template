import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { requireAdminSession } from '#/lib/admin-auth'

const ensureAdminAccess = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  return { ok: true as const }
})

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  beforeLoad: async () => {
    try {
      await ensureAdminAccess()
    } catch {
      throw redirect({
        to: '/demo/better-auth',
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
