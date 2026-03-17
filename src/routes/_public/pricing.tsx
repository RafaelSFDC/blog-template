import { usePostHog } from "@posthog/react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContent } from "#/components/cms/PageContent";
import { Button } from "#/components/ui/button";
import { captureClientEvent } from "#/lib/analytics-client";
import { captureClientException } from "#/lib/sentry-client";
import { getOptionalPublicPageBySlug } from "#/server/actions/public/content";
import { getPricingPageData } from "#/server/actions/public/site";

const pricingSearchSchema = z.object({
  plan: z.enum(["monthly", "annual"]).optional(),
  source: z.string().trim().min(1).max(120).optional(),
  paywallVariant: z.string().trim().min(1).max(120).optional(),
  postSlug: z.string().trim().min(1).max(160).optional(),
});

export const Route = createFileRoute("/_public/pricing")({
  validateSearch: pricingSearchSchema,
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
  const { plans, comparison, isAuthenticated, cmsPage } = Route.useLoaderData();
  const search = Route.useSearch();
  type PricingPlan = (typeof plans)[number];
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<"monthly" | "annual">(
    search.plan ??
      comparison.recommendedPlanSlug ??
      (plans.find((plan: PricingPlan) => plan.isActive)?.slug === "monthly" ? "monthly" : "annual"),
  );
  const posthog = usePostHog();
  const pricingSource = search.source ?? "pricing_page";
  const selectedPlan =
    plans.find((plan: PricingPlan) => plan.slug === selectedPlanSlug) ??
    plans.find((plan: PricingPlan) => plan.slug === comparison.recommendedPlanSlug) ??
    plans[0];
  const selectedIsRecommended = selectedPlan?.slug === comparison.recommendedPlanSlug;

  function trackPricingSelection(planSlug: "monthly" | "annual", interactionSource: string) {
    captureClientEvent(posthog, "pricing_plan_selected", {
      surface: "public_site",
      path: "/pricing",
      plan_slug: planSlug,
      source: interactionSource,
      paywall_variant: search.paywallVariant,
      post_slug: search.postSlug,
    });
  }

  function handlePlanSelection(planSlug: "monthly" | "annual") {
    setSelectedPlanSlug(planSlug);
    trackPricingSelection(planSlug, pricingSource);
  }

  function buildPricingContextHeaders(planSlug: "monthly" | "annual") {
    return {
      "Content-Type": "application/json",
      "X-PostHog-Session-Id": posthog.get_session_id() ?? "",
      "X-PostHog-Distinct-Id": posthog.get_distinct_id() ?? "",
      "X-Conversion-Source": pricingSource,
      "X-Paywall-Variant": search.paywallVariant ?? "",
      "X-Post-Slug": search.postSlug ?? "",
      "X-Selected-Plan": planSlug,
    };
  }

  async function startCheckout(planSlug: "monthly" | "annual") {
    try {
      setLoadingPlan(planSlug);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: buildPricingContextHeaders(planSlug),
        body: JSON.stringify({ planSlug }),
      });

      if (response.status === 401) {
        const callbackUrl = `/pricing?plan=${encodeURIComponent(planSlug)}&source=${encodeURIComponent(pricingSource)}${search.paywallVariant ? `&paywallVariant=${encodeURIComponent(search.paywallVariant)}` : ""}${search.postSlug ? `&postSlug=${encodeURIComponent(search.postSlug)}` : ""}`;
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
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
          pricingSource,
        },
      });
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePrimaryCta() {
    if (!selectedPlan) {
      toast.error("No membership plan is available right now.");
      return;
    }

    captureClientEvent(posthog, "pricing_cta_clicked", {
      surface: "public_site",
      path: "/pricing",
      plan_slug: selectedPlan.slug,
      source: pricingSource,
      paywall_variant: search.paywallVariant,
      post_slug: search.postSlug,
    });

    if (!selectedPlan.isActive) {
      toast.error("This membership plan is not configured yet.");
      return;
    }

    await startCheckout(selectedPlan.slug as "monthly" | "annual");
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
              <p className="mb-0 font-black text-primary/80">Publication memberships</p>
            </div>
            <h1 className="display-title text-5xl text-foreground sm:text-7xl">
              Premium Access
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground">
              Compare monthly and annual access clearly, pick the right commitment, and move to checkout without second-guessing the value.
            </p>
            <p className="mt-4 max-w-3xl text-sm font-medium text-muted-foreground">
              This page sells reader access to this publication. If you are evaluating the
              Lumina product itself, start at <a className="font-bold text-primary underline-offset-4 hover:underline" href="/lumina/pricing">Lumina product pricing</a>.
            </p>
          </section>
        </main>
      )}

      <section className="page-wrap mt-2 grid gap-8 pb-20 lg:grid-cols-[1.2fr_0.8fr]" id="pricing-plans">
        <div className="space-y-8">
          <article className="rounded-2xl border border-primary/20 bg-primary/5 p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Membership value
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
                  Choose the commitment that matches reader confidence
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Premium membership unlocks the full archive, premium posts, and a cleaner reading rhythm. The annual path is optimized for loyalty, while monthly keeps entry friction lower.
                </p>
              </div>
              {comparison.annualSavingsLabel ? (
                <div className="rounded-full border border-primary/20 bg-card px-4 py-2 text-sm font-black text-primary">
                  {comparison.annualSavingsLabel}
                </div>
              ) : null}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
              <div className="grid grid-cols-3 border-b bg-muted/20 px-4 py-3 text-sm font-black text-foreground">
                <span>What is included</span>
                <span className="text-center">Monthly</span>
                <span className="text-center">Annual</span>
              </div>
              {comparison.benefitRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 items-center border-b border-border/50 px-4 py-4 text-sm last:border-b-0"
                >
                  <span className="font-semibold text-foreground">{row.label}</span>
                  <span className="text-center text-muted-foreground">{row.monthly}</span>
                  <span className="text-center text-muted-foreground">{row.annual}</span>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan: PricingPlan) => {
              const isSelected = selectedPlan?.slug === plan.slug;
              const isRecommended = comparison.recommendedPlanSlug === plan.slug;

              return (
                <article
                  key={plan.slug}
                  className={`rounded-2xl border p-8 shadow-sm transition ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isRecommended
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card"
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
                    {isRecommended ? (
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

                  {plan.slug === "annual" && comparison.annualSavingsLabel ? (
                    <div className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-primary">
                      {comparison.annualSavingsLabel}
                    </div>
                  ) : null}

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

                  <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Why this works
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.slug === "annual"
                        ? "Best for loyal readers who already know this publication deserves a long-term seat in their inbox."
                        : "Best for readers who want premium access now with a lighter commitment."}
                    </p>
                  </div>

                  <Button
                    className="mt-8 w-full"
                    variant={isSelected ? "default" : "outline"}
                    size="lg"
                    onClick={() => handlePlanSelection(plan.slug as "monthly" | "annual")}
                  >
                    {isSelected ? "Selected plan" : `Choose ${plan.name}`}
                  </Button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <article className="rounded-2xl border bg-card p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Selected path
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
              {selectedPlan?.name ?? "Membership"}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {selectedIsRecommended
                ? comparison.recommendedReason
                : selectedPlan?.slug === "monthly"
                  ? "Start with the lighter commitment and move quickly into premium reading."
                  : "Lock in the best value when you already know this publication earns repeat attention."}
            </p>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-black text-foreground">
                {selectedPlan ? formatMoney(selectedPlan.priceCents, selectedPlan.currency) : "Configured in Stripe"}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  / {selectedPlan?.interval === "year" ? "year" : "month"}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedPlan?.slug === "annual"
                  ? "Annual reduces renewal friction and makes the value proposition cleaner for committed readers."
                  : "Monthly keeps the premium upgrade path open with a lower upfront commitment."}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedPlan?.isActive || loadingPlan === selectedPlan?.slug}
                onClick={() => void handlePrimaryCta()}
              >
                {!selectedPlan?.isActive
                  ? "Plan not configured"
                  : loadingPlan === selectedPlan?.slug
                    ? "Redirecting..."
                    : isAuthenticated
                      ? "Continue to checkout"
                      : "Sign in to subscribe"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a href="#pricing-faq">Review purchase FAQs</a>
              </Button>
            </div>

            <div className="mt-6 grid gap-3">
              {[
                "Monthly vs annual is explicit before checkout",
                "The selected plan stays measurable in analytics",
                "Reader access remains separate from Lumina product pricing",
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm font-medium text-foreground"
                >
                  {point}
                </div>
              ))}
            </div>
          </article>

          <article
            id="pricing-faq"
            className="rounded-2xl border bg-card p-8 shadow-sm"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Trust signals
                </p>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Common buying questions
                </h2>
              </div>
            </div>

            <div className="grid gap-4">
              {comparison.faqItems.map((item) => (
                <div key={item.question} className="rounded-xl border border-border/60 bg-muted/20 p-5">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-black uppercase tracking-[0.16em]">FAQ</p>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

