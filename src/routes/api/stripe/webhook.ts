import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { processStripeWebhookEvent } from "#/server/membership-actions";
import { captureServerEvent } from "#/server/analytics";
import { captureServerException } from "#/server/sentry";
import { stripe } from "#/server/stripe";
import { logOperationalEvent } from "#/server/system/operations";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
          return new Response("Webhook Secret or Signature missing", { status: 400 });
        }

        let event: Stripe.Event;

        try {
          event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (error: unknown) {
          captureServerException(error, {
            tags: {
              area: "api",
              flow: "stripe-webhook-construct",
            },
            extras: {
              requestUrl: request.url,
            },
          });
          const message = error instanceof Error ? error.message : "Unknown";
          return new Response(`Webhook Error: ${message}`, { status: 400 });
        }

        try {
          const result = await processStripeWebhookEvent(event);
          logOperationalEvent("stripe-webhook-processed", {
            eventType: event.type,
            duplicate: result.duplicate,
            eventId: event.id,
          });

          if (!result.duplicate) {
            if (event.type === "checkout.session.completed") {
              const session = event.data.object as Stripe.Checkout.Session;
              await captureServerEvent({
                distinctId: session.customer_email || session.metadata?.userId || "stripe-checkout",
                event: "checkout_completed",
                properties: {
                  user_id: session.metadata?.userId,
                  customer_email: session.customer_email,
                  stripe_customer_id: session.customer,
                  stripe_subscription_id: session.subscription,
                  plan_slug: session.metadata?.planSlug,
                  surface: "checkout",
                },
              });
            }

            if (event.type === "customer.subscription.deleted") {
              const subscription = event.data.object as Stripe.Subscription;
              await captureServerEvent({
                distinctId: String(subscription.customer || "stripe-billing"),
                event: "subscription_canceled",
                properties: {
                  stripe_customer_id: subscription.customer,
                  stripe_subscription_id: subscription.id,
                  surface: "billing",
                },
              });
            }
          }

          return new Response(JSON.stringify({ received: true, duplicate: result.duplicate }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: unknown) {
          captureServerException(error, {
            tags: {
              area: "api",
              flow: "stripe-webhook",
              eventType: event.type,
            },
            extras: {
              requestUrl: request.url,
            },
          });
          logOperationalEvent("stripe-webhook-failed", {
            eventType: event.type,
            eventId: event.id,
          }, "error");

          const message = error instanceof Error ? error.message : "Internal Server Error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
