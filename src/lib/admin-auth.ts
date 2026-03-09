import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'
import { redirect } from '@tanstack/react-router'

export async function getAuthSession() {
  const request = getRequest()
  if (!request) return null
  return await auth.api.getSession({
    headers: request.headers,
  })
}

export async function requireSession() {
  const session = await getAuthSession()

  if (!session?.user) {
    throw redirect({
      to: '/login',
    })
  }

  return session
}

export async function requireDashboardAccess() {
  const session = await getAuthSession()

  if (!session?.user) {
    throw redirect({
      to: '/dashboard/login',
    })
  }

  // Reader role is explicitly denied from dashboard
  if (session.user.role === 'reader') {
    throw redirect({
      to: '/', // Redirect back to home or a "not authorized" page
    })
  }

  return session
}

export async function requireAdminSession() {
  const session = await requireDashboardAccess()

  if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
    throw redirect({
      to: '/dashboard',
    })
  }

  return session
}

export async function requireSuperAdminSession() {
  const session = await requireDashboardAccess()

  if (session.user.role !== 'super-admin') {
    throw redirect({
      to: '/dashboard',
    })
  }

  return session
}
