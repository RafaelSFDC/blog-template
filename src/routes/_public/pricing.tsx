import { usePostHog } from "@posthog/react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { PageContent } from "#/components/cms/PageContent";
import { captureClientException } from "#/lib/sentry-client";
import { getOptionalPublicPageBySlug } from "#/server/public/content";
import { getPricingPageData } from "#/server/public/site";

export const Route = createFileRoute("/_public/pricing")({
  loader: async () => {
    const [pricingData, cmsPage] = await Promise.all([
      getPricingPageData(),
      getOptionalPublicPageBySlug({ data: "pricing" }),
    ]);

    return {
      ...pricingData,
      cmsPage,
    };
  },
  component: PricingPage,
});

function formatMoney(amount?: number | null, currency = "usd") {
  if (!amount) {
    return "Configured in Stripe";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function PricingPage() {
  const { plans, isAuthenticated, cmsPage } = Route.useLoaderData();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const posthog = usePostHog();

  async function handleCheckout(planSlug: "monthly" | "annual") {
    try {
      setLoadingPlan(planSlug);
      posthog.capture("pricing_checkout_started", {
        plan_slug: planSlug,
      });

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PostHog-Session-Id": posthog.get_session_id() ?? "",
          "X-PostHog-Distinct-Id": posthog.get_distinct_id() ?? "",
        },
        body: JSON.stringify({ planSlug }),
      });

      if (response.status === 401) {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }

      window.location.href = data.url;
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "public",
          flow: "pricing-checkout",
        },
        extras: {
          planSlug,
        },
      });
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      {cmsPage?.page ? (
        <PageContent
          title={cmsPage.page.title}
          description={cmsPage.page.excerpt}
          content={cmsPage.page.content}
        />
      ) : (
        <main className="page-wrap pb-8 pt-10">
          <section className="rounded-md border bg-card p-8 shadow-sm sm:p-12">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <CreditCard size={20} strokeWidth={3} />
              <p className="mb-0 font-black text-primary/80">Memberships</p>
            </div>
            <h1 className="display-title text-5xl text-foreground sm:text-7xl">
              Premium Access
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground">
              Unlock every premium post and premium page with one site-wide membership.
              Choose the cadence that fits your readers best.
            </p>
          </section>
        </main>
      )}

      <section className="page-wrap mt-2 grid gap-8 pb-20 lg:grid-cols-2" id="pricing-plans">
        {plans.map((plan) => (
          <article
            key={plan.slug}
            className={`rounded-2xl border p-8 shadow-sm ${
              plan.isDefault ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                  {plan.slug}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  {plan.name}
                </h2>
              </div>
              {plan.isDefault ? (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Recommended
                </span>
              ) : null}
            </div>

            <p className="mt-6 text-4xl font-black tracking-tight text-foreground">
              {formatMoney(plan.priceCents, plan.currency)}
              <span className="ml-2 text-base font-medium text-muted-foreground">
                / {plan.interval === "year" ? "year" : "month"}
              </span>
            </p>

            <p className="mt-4 min-h-12 text-sm leading-relaxed text-muted-foreground">
              {plan.description || "Full premium access for your readers."}
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Unlimited premium articles",
                "Premium static pages and member-only sections",
                "Billing self-service through Stripe",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button
              className="mt-8 w-full"
              size="lg"
              disabled={!plan.isActive || loadingPlan === plan.slug}
              onClick={() => void handleCheckout(plan.slug as "monthly" | "annual")}
            >
              {!plan.isActive
                ? "Plan not configured"
                : loadingPlan === plan.slug
                  ? "Redirecting..."
                  : isAuthenticated
                    ? "Subscribe now"
                    : "Sign in to subscribe"}
            </Button>
          </article>
        ))}
      </section>
    </>
  );
}
