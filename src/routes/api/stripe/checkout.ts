import { createFileRoute } from '@tanstack/react-router'
import { stripe } from '../../../server/stripe'
import { auth } from '../../../lib/auth'
import { getPostHogClient } from '../../../server/posthog'

export const Route = createFileRoute('/api/stripe/checkout')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if (!session || !session.user) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { priceId } = await request.json() as { priceId: string }

        if (!priceId) {
            return new Response('Price ID is required', { status: 400 })
        }

        const sessionId = request.headers.get('X-PostHog-Session-Id')
        const distinctId = request.headers.get('X-PostHog-Distinct-Id') || session.user.email

        try {
            const checkoutSession = await stripe.checkout.sessions.create({
                customer_email: session.user.email,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${new URL(request.url).origin}/dashboard/settings?success=true`,
                cancel_url: `${new URL(request.url).origin}/dashboard/settings?canceled=true`,
                metadata: {
                    userId: session.user.id,
                },
            })

            const posthog = getPostHogClient()
            posthog.capture({
                distinctId,
                event: 'subscription_checkout_created',
                properties: {
                    $session_id: sessionId || undefined,
                    price_id: priceId,
                    user_id: session.user.id,
                    user_email: session.user.email,
                    checkout_session_id: checkoutSession.id,
                },
            })

            return new Response(JSON.stringify({ url: checkoutSession.url }), {
                headers: { 'Content-Type': 'application/json' },
            })
        } catch (error: any) {
            console.error('Stripe error:', error)
            return new Response(error.message, { status: 500 })
        }
      },
    }
  }
})
