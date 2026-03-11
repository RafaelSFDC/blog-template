import { createFileRoute } from '@tanstack/react-router'
import { stripe } from '../../../server/stripe'
import { db } from '../../../db/index'
import { user } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { getPostHogClient } from '../../../server/posthog'

export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
          return new Response('Webhook Secret or Signature missing', { status: 400 })
        }

        let event: Stripe.Event

        try {
          event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
          )
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown'
          return new Response(`Webhook Error: ${message}`, { status: 400 })
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            ) as Stripe.Subscription

            const userId = session.metadata?.userId

            if (userId) {
                await db.update(user)
                    .set({
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0]?.price.id ?? null,
                        stripeCurrentPeriodEnd: subscription.items.data[0]?.current_period_end
                          ? new Date(subscription.items.data[0].current_period_end * 1000)
                          : null,
                    })
                    .where(eq(user.id, userId))

                const posthog = getPostHogClient()
                posthog.capture({
                    distinctId: session.customer_email || userId,
                    event: 'subscription_activated',
                    properties: {
                        user_id: userId,
                        customer_email: session.customer_email,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: subscription.id,
                        price_id: subscription.items.data[0].price.id,
                    },
                })
            }
        }

        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice
            const subscriptionId =
              invoice.parent &&
              invoice.parent.type === 'subscription_details'
                ? invoice.parent.subscription_details?.subscription
                : null

            if (!subscriptionId || typeof subscriptionId !== 'string') {
              return new Response(JSON.stringify({ received: true }), {
                headers: { 'Content-Type': 'application/json' },
              })
            }

            const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
            ) as Stripe.Subscription

            await db.update(user)
                .set({
                    stripePriceId: subscription.items.data[0]?.price.id ?? null,
                    stripeCurrentPeriodEnd: subscription.items.data[0]?.current_period_end
                      ? new Date(subscription.items.data[0].current_period_end * 1000)
                      : null,
                })
                .where(eq(user.stripeSubscriptionId, subscription.id))
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
      },
    }
  }
})
