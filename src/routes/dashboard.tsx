import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from "react"
import { usePostHog } from "@posthog/react"
import { checkDashboardAccess } from '#/server/system/dashboard-access'
import { captureClientEvent } from "#/lib/analytics-client"
import { getSetupStatus, skipSetup } from '#/server/setup-actions'
import { shouldRedirectToSetup } from '#/lib/setup'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const result = await checkDashboardAccess()
    if (!result.ok) {
      throw redirect({
        to: result.reason === 'unauthenticated' ? '/auth/login' : '/',
      })
    }

    const pathname = location.pathname
    const skipSetupRequested = new URLSearchParams(location.search).get("skipSetup") === "1"
    if (pathname === '/dashboard/setup') {
      return
    }

    if (result.session.user.role === 'admin' || result.session.user.role === 'super-admin') {
      if (skipSetupRequested) {
        await skipSetup()
        throw redirect({
          to: '/dashboard',
        })
      }

      const setupStatus = await getSetupStatus()
      if (shouldRedirectToSetup(setupStatus, result.session.user.role)) {
        throw redirect({
          to: '/dashboard/setup',
        })
      }
    }
  },
  component: DashboardLayout,
})

import { DashboardSidebar } from '#/components/dashboard/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '#/components/ui/sidebar'

function DashboardLayout() {
  const posthog = usePostHog()

  useEffect(() => {
    captureClientEvent(posthog, "dashboard_session_started", {
      path: typeof window !== "undefined" ? window.location.pathname : "/dashboard",
      surface: "dashboard",
    })
  }, [posthog])

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col min-h-svh bg-background text-foreground selection:bg-primary/25">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 lg:hidden">
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
