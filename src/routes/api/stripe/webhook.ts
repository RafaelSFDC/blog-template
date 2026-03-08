import { createFileRoute } from '@tanstack/react-router'
import { stripe } from '../../../server/stripe'
import { db } from '../../../db/index'
import { user } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

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
        } catch (err: any) {
          return new Response(`Webhook Error: ${err.message}`, { status: 400 })
        }

        const session = event.data.object as Stripe.Checkout.Session

        if (event.type === 'checkout.session.completed') {
            const subscription = (await stripe.subscriptions.retrieve(
                session.subscription as string
            )) as any

            const userId = session.metadata?.userId

            if (userId) {
                await db.update(user)
                    .set({
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    })
                    .where(eq(user.id, userId))
            }
        }

        if (event.type === 'invoice.payment_succeeded') {
            const subscription = (await stripe.subscriptions.retrieve(
                session.subscription as string
            )) as any

            await db.update(user)
                .set({
                    stripePriceId: subscription.items.data[0].price.id,
                    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
