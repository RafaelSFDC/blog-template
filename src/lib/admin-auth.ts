import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

export async function getAuthSession() {
  const request = getRequest()
  return await auth.api.getSession({
    headers: request.headers,
  })
}

export async function requireAdminSession() {
  const session = await getAuthSession()

  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  return session
}
