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
import { SidebarProvider, SidebarInset, SidebarTrigger } from '#/components/ui/sidebar'

function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col min-h-svh bg-background text-foreground selection:bg-primary/25">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b-4 border-border px-4 lg:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2 font-black uppercase text-xs tracking-widest">
            <span className="text-muted-foreground">Dashboard</span>
          </div>
        </header>
        <main className="flex-1 px-6 py-10 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
