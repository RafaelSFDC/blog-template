import { createFileRoute } from "@tanstack/react-router";
import { captureServerEvent } from "#/server/analytics";
import { captureServerException } from "#/server/sentry";
import { getPricingPlansData } from "#/server/membership-actions";
import { stripe } from "#/server/stripe";
import { auth } from "#/server/auth/auth";
import { stripeCheckoutSchema } from "#/schemas";

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const payload = stripeCheckoutSchema.parse(await request.json());
        const plans = await getPricingPlansData();
        const selectedPlan =
          (payload.planSlug
            ? plans.find((plan) => plan.slug === payload.planSlug)
            : payload.priceId
              ? plans.find((plan) => plan.stripePriceId === payload.priceId)
              : plans.find((plan) => plan.isDefault && plan.isActive)) ??
          plans.find((plan) => plan.isActive);

        if (!selectedPlan?.stripePriceId) {
          return new Response(
            JSON.stringify({ error: "No membership plan is configured for checkout" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const sessionId = request.headers.get("X-PostHog-Session-Id");
        const distinctId = request.headers.get("X-PostHog-Distinct-Id") || session.user.email;
        const referer = request.headers.get("referer") || "";
        const source = referer.includes("/blog/") ? "paywall" : "pricing_page";

        try {
          const origin = new URL(request.url).origin;
          const checkoutSession = await stripe.checkout.sessions.create({
            customer_email: session.user.email,
            line_items: [
              {
                price: selectedPlan.stripePriceId,
                quantity: 1,
              },
            ],
            mode: "subscription",
            success_url: `${origin}/account?success=true`,
            cancel_url: `${origin}/pricing?canceled=true`,
            metadata: {
              userId: session.user.id,
              planSlug: selectedPlan.slug,
            },
          });

          await captureServerEvent({
            distinctId,
            event: "checkout_started",
            properties: {
              $session_id: sessionId || undefined,
              user_id: session.user.id,
              user_email: session.user.email,
              checkout_session_id: checkoutSession.id,
              plan_slug: selectedPlan.slug,
              price_id: selectedPlan.stripePriceId,
              path: referer || undefined,
              source,
              surface: "checkout",
            },
          });

          return new Response(JSON.stringify({ url: checkoutSession.url }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: unknown) {
          captureServerException(error, {
            tags: {
              area: "api",
              flow: "stripe-checkout",
            },
            extras: {
              requestUrl: request.url,
              planSlug: selectedPlan.slug,
              priceId: selectedPlan.stripePriceId,
              userId: session.user.id,
            },
            user: {
              id: session.user.id,
              email: session.user.email,
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
