import {
  analyticsRangeOptions,
  buildEventBreakdownQuery,
  buildEventCountQuery,
  compactAnalyticsProperties,
  resolveAnalyticsRange,
} from "#/lib/analytics-events";
import { queryPostHog } from "#/server/analytics";

type HogQLCountResult = {
  results: Array<[number] | [string, number]>;
};

function getCountFromResult(result: HogQLCountResult) {
  const row = result.results[0];
  if (!row) {
    return 0;
  }

  const value = row[row.length - 1];
  return typeof value === "number" ? value : Number(value || 0);
}

function toBreakdownRows(result: HogQLCountResult) {
  return result.results.map((row) => ({
    label: String(row[0] ?? "unknown"),
    count: Number(row[1] ?? 0),
  }));
}

export async function getAnalyticsDashboard(rangeInput?: string | null) {
  const range = resolveAnalyticsRange(rangeInput);

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.VITE_POSTHOG_PROJECT_ID;
  const isConfigured = Boolean(apiKey && projectId);

  if (!isConfigured) {
    return {
      isConfigured: false,
      range,
      rangeOptions: analyticsRangeOptions,
      sections: null,
    };
  }

  const [
    setupStarted,
    setupCompleted,
    setupSkipped,
    pricingConfigured,
    newsletterConfigured,
    firstPostPublished,
    marketingViews,
    marketingCtas,
    betaRequests,
    checkoutStarted,
    checkoutCompleted,
    subscriptionCanceled,
    billingPortalOpened,
    paywallClicks,
    newsletterCampaignSent,
    firstSubscriberCaptured,
    dashboardSessions,
    setupSteps,
  ] = await Promise.all([
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("project_setup_started", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("project_setup_completed", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("project_setup_skipped", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("pricing_configured", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("newsletter_configured", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("first_post_published", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("lumina_marketing_page_view", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("lumina_cta_clicked", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("lumina_beta_request_submitted", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("checkout_started", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("checkout_completed", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("subscription_canceled", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("billing_portal_opened", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("paywall_cta_clicked", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("newsletter_campaign_sent", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("first_subscriber_captured", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("dashboard_session_started", range) }),
    queryPostHog<HogQLCountResult>({
      kind: "HogQLQuery",
      query: buildEventBreakdownQuery("project_setup_step_completed", range, "step", 5),
    }),
  ]);

  const startedCount = getCountFromResult(setupStarted);
  const completedCount = getCountFromResult(setupCompleted);
  const skippedCount = getCountFromResult(setupSkipped);
  const checkoutStartedCount = getCountFromResult(checkoutStarted);
  const checkoutCompletedCount = getCountFromResult(checkoutCompleted);
  const marketingViewsCount = getCountFromResult(marketingViews);
  const marketingCtasCount = getCountFromResult(marketingCtas);
  const betaRequestCount = getCountFromResult(betaRequests);
  const dashboardSessionCount = getCountFromResult(dashboardSessions);

  return {
    isConfigured: true,
    range,
    rangeOptions: analyticsRangeOptions,
    sections: {
      activation: {
        cards: [
          { label: "Setup started", value: startedCount },
          { label: "Setup completed", value: completedCount },
          { label: "Pricing configured", value: getCountFromResult(pricingConfigured) },
          { label: "Newsletter configured", value: getCountFromResult(newsletterConfigured) },
          { label: "First posts published", value: getCountFromResult(firstPostPublished) },
        ],
      },
      acquisition: {
        cards: [
          { label: "Lumina page views", value: marketingViewsCount },
          { label: "CTA clicks", value: marketingCtasCount },
          { label: "Beta requests", value: betaRequestCount },
        ],
        funnel: [
          { label: "Marketing views", value: marketingViewsCount },
          { label: "CTA clicks", value: marketingCtasCount },
          { label: "Beta requests", value: betaRequestCount },
        ],
      },
      monetization: {
        cards: [
          { label: "Checkout starts", value: checkoutStartedCount },
          { label: "Checkout completions", value: checkoutCompletedCount },
          { label: "Billing portal opens", value: getCountFromResult(billingPortalOpened) },
          { label: "Canceled subscriptions", value: getCountFromResult(subscriptionCanceled) },
        ],
        funnel: [
          { label: "Paywall CTA clicks", value: getCountFromResult(paywallClicks) },
          { label: "Checkout starts", value: checkoutStartedCount },
          { label: "Checkout completions", value: checkoutCompletedCount },
        ],
      },
      retention: {
        cards: [
          { label: "Dashboard sessions", value: dashboardSessionCount },
          { label: "Newsletter campaigns sent", value: getCountFromResult(newsletterCampaignSent) },
          { label: "First subscribers captured", value: getCountFromResult(firstSubscriberCaptured) },
        ],
      },
      onboarding: {
        cards: [
          { label: "Setup skipped", value: skippedCount },
          {
            label: "Completion rate",
            value: startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
            suffix: "%",
          },
        ],
        breakdown: toBreakdownRows(setupSteps),
      },
    },
    summary: compactAnalyticsProperties({
      setup_completion_rate:
        startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
      marketing_to_beta_rate:
        marketingViewsCount > 0 ? Math.round((betaRequestCount / marketingViewsCount) * 100) : 0,
      checkout_completion_rate:
        checkoutStartedCount > 0
          ? Math.round((checkoutCompletedCount / checkoutStartedCount) * 100)
          : 0,
    }),
  };
}

export type AnalyticsDashboardData = Awaited<
  ReturnType<typeof getAnalyticsDashboard>
>;
