import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { processStripeWebhookEvent } from "#/server/membership-actions";
import { getPostHogClient } from "#/server/posthog";
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

          const posthog = getPostHogClient();
          if (!result.duplicate) {
            if (event.type === "checkout.session.completed") {
              const session = event.data.object as Stripe.Checkout.Session;
              posthog.capture({
                distinctId: session.customer_email || session.metadata?.userId || "stripe-checkout",
                event: "subscription_activated",
                properties: {
                  user_id: session.metadata?.userId,
                  customer_email: session.customer_email,
                  stripe_customer_id: session.customer,
                  stripe_subscription_id: session.subscription,
                  plan_slug: session.metadata?.planSlug,
                },
              });
            }

            if (event.type === "invoice.payment_failed") {
              const invoice = event.data.object as Stripe.Invoice;
              posthog.capture({
                distinctId: String(invoice.customer_email || invoice.customer || "stripe-billing"),
                event: "subscription_past_due",
                properties: {
                  stripe_customer_id: invoice.customer,
                  stripe_subscription_id: invoice.subscription,
                },
              });
            }

            if (event.type === "customer.subscription.deleted") {
              const subscription = event.data.object as Stripe.Subscription;
              posthog.capture({
                distinctId: String(subscription.customer || "stripe-billing"),
                event: "subscription_canceled",
                properties: {
                  stripe_customer_id: subscription.customer,
                  stripe_subscription_id: subscription.id,
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
