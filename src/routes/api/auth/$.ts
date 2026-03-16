import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/server/auth/auth'
import { isRegistrationLocked, lockRegistration } from '#/server/auth/registration'
import { enforceRateLimit } from '#/server/security/rate-limit'
import { getSecurityRequestMetadata } from '#/server/security/request'
import { verifyTurnstileToken } from '#/server/integrations/turnstile'
import { logSecurityEvent } from '#/server/security/events'

async function parseAuthRequestBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.clone().json().catch(() => ({}))) as Record<string, unknown>;
    return body;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.clone().formData().catch(() => null);
    if (!formData) return {};
    return Object.fromEntries(formData.entries());
  }

  return {};
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: async ({ request }) => {
        const url = new URL(request.url)
        const isSignUpRoute = url.pathname.endsWith('/sign-up/email')
        const isSignInRoute = url.pathname.endsWith('/sign-in/email')
        const isRequestPasswordResetRoute = url.pathname.endsWith('/request-password-reset')
        const isResetPasswordRoute = /\/reset-password(?:\/|$)/.test(url.pathname)
        const isProtectedRoute =
          isSignUpRoute || isSignInRoute || isRequestPasswordResetRoute || isResetPasswordRoute

        const body = isProtectedRoute ? await parseAuthRequestBody(request) : {}
        const email =
          typeof body.email === "string" && body.email.trim().length > 0
            ? body.email.trim().toLowerCase()
            : null
        const turnstileToken =
          request.headers.get("x-turnstile-token") ||
          (typeof body.turnstileToken === "string" ? body.turnstileToken : "")

        if (isSignUpRoute && (await isRegistrationLocked())) {
          return new Response('Registration is closed.', { status: 403 })
        }

        if (isProtectedRoute) {
          const scope = isSignUpRoute
            ? "auth.sign_up"
            : isSignInRoute
              ? "auth.sign_in"
              : isRequestPasswordResetRoute
                ? "auth.request_password_reset"
                : "auth.reset_password";

          const decision = await enforceRateLimit({
            scope,
            request,
            keyParts: [email],
            limit: isSignInRoute ? 8 : 5,
            windowMs: isSignInRoute ? 10 * 60 * 1000 : 15 * 60 * 1000,
          })

          if (!decision.allowed) {
            return new Response("Too many attempts. Please try again later.", {
              status: 429,
              headers: {
                "Retry-After": String(decision.retryAfterSeconds),
              },
            })
          }

          const metadata = getSecurityRequestMetadata(request)
          const verification = await verifyTurnstileToken({
            token: turnstileToken,
            ip: metadata.ip,
          })

          if (!verification.success) {
            await logSecurityEvent({
              type: "turnstile.failed",
              scope,
              ipHash: metadata.ipHash,
              userAgent: metadata.userAgentShort,
              metadata: {
                errors: verification.errors ?? [],
                email,
              },
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            })
            return new Response("Security verification failed. Please try again.", { status: 403 })
          }
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
