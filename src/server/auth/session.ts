import { getRequest } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'

function normalizeDashboardRole(role?: string | null) {
  if (role === 'superAdmin') {
    return 'super-admin'
  }

  return role ?? null
}

// Roles that are allowed inside the dashboard
const DASHBOARD_ROLES = new Set(['author', 'editor', 'moderator', 'admin', 'super-admin'])

export async function getAuthSession() {
  const { auth } = await import('#/server/auth/auth')
  const request = getRequest()
  if (!request) return null
  return await auth.api.getSession({
    headers: request.headers,
  })
}

/**
 * Returns the authenticated session or null — never throws.
 * Use this in server fns that dashboard.tsx beforeLoad calls,
 * so that a plain non-authenticated state doesn't get swallowed
 * by the outer try/catch and cause an infinite redirect loop.
 */
export async function getDashboardSession() {
  const session = await getAuthSession()
  const role = normalizeDashboardRole(session?.user?.role)
  if (!session?.user || !DASHBOARD_ROLES.has(role as string)) {
    return { ok: false as const, reason: !session?.user ? 'unauthenticated' : 'forbidden' }
  }
  if (session.user.role !== role && role) {
    session.user.role = role
  }
  return { ok: true as const, session }
}

export async function requireSession() {
  const session = await getAuthSession()

  if (!session?.user) {
    throw redirect({
      to: '/auth/login',
    })
  }

  return session
}

export async function requireDashboardAccess() {
  const session = await getAuthSession()

  if (!session?.user) {
    throw redirect({ to: '/auth/login' })
  }

  const role = normalizeDashboardRole(session.user.role)
  if (!DASHBOARD_ROLES.has(role as string)) {
    throw redirect({ to: '/' })
  }
  if (session.user.role !== role && role) {
    session.user.role = role
  }

  return session
}

export async function requireAdminSession() {
  const session = await requireDashboardAccess()

  if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
    throw redirect({ to: '/dashboard' })
  }

  return session
}

export async function requireSuperAdminSession() {
  const session = await requireDashboardAccess()

  if (session.user.role !== 'super-admin') {
    throw redirect({ to: '/dashboard' })
  }

  return session
}
