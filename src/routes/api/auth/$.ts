import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/server/auth/auth'
import { isRegistrationLocked, lockRegistration } from '#/server/auth/registration'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: async ({ request }) => {
        const url = new URL(request.url)
        const isSignUpRoute = url.pathname.endsWith('/sign-up/email')

        if (isSignUpRoute && (await isRegistrationLocked())) {
          return new Response('Registration is closed.', { status: 403 })
        }

        const response = await auth.handler(request)

        if (isSignUpRoute && response.ok) {
          await lockRegistration()
        }

        return response
      },
    },
  },
})
