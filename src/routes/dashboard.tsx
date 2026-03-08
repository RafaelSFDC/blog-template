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

function DashboardLayout() {
  return <Outlet />
}
