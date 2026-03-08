import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? ''
}

export async function getAuthSession() {
  const request = getRequest()
  return await auth.api.getSession({
    headers: request.headers,
  })
}

export async function requireAdminSession() {
  const session = await getAuthSession()
  const adminEmail = getAdminEmail()
  const userEmail = session?.user?.email?.toLowerCase()

  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  if (!adminEmail || userEmail !== adminEmail) {
    throw new Response('Forbidden', { status: 403 })
  }

  return session
}
