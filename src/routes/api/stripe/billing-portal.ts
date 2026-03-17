import { createFileRoute } from "@tanstack/react-router";
import { captureServerEvent } from "#/server/analytics";
import { captureServerException } from "#/server/sentry";
import { getCurrentSubscription } from "#/server/actions/membership-actions";
import { stripe } from "#/server/stripe";
import { auth } from "#/server/auth/auth";

export const Route = createFileRoute("/api/stripe/billing-portal")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const sessionUser = session.user as typeof session.user & {
          stripeCustomerId?: string | null;
        };

        try {
          const retentionState = request.headers.get("X-Retention-State");
          const subscription = await getCurrentSubscription(sessionUser.id);
          const customerId = subscription?.stripeCustomerId ?? sessionUser.stripeCustomerId;

          if (!customerId) {
            return new Response(JSON.stringify({ error: "No billing customer linked to this account" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${new URL(request.url).origin}/account`,
          });

          await captureServerEvent({
            distinctId: sessionUser.email,
            event: "billing_portal_opened",
            properties: {
              user_id: sessionUser.id,
              stripe_customer_id: customerId,
              account_retention_state: retentionState || undefined,
              source: "account_page",
              surface: "billing",
            },
          });

          return new Response(JSON.stringify({ url: portal.url }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: unknown) {
          captureServerException(error, {
            tags: {
              area: "api",
              flow: "stripe-billing-portal",
            },
            extras: {
              requestUrl: request.url,
              userId: sessionUser.id,
            },
          });

          const message = error instanceof Error ? error.message : "Internal Server Error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

