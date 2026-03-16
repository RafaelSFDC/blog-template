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

type AnalyticsCard = {
  label: string;
  value: number;
  suffix?: string;
};

function buildBreakdownQuery(
  event: Parameters<typeof buildEventBreakdownQuery>[0],
  range: Parameters<typeof buildEventBreakdownQuery>[1],
  property: string,
  limit = 5,
  extraFilters?: string[],
) {
  const clauses = [
    `SELECT properties['${property}'] AS value, count() AS count`,
    "FROM events",
    `WHERE ${buildEventCountQuery(event, range, extraFilters).replace("SELECT count() FROM events WHERE ", "")}`,
    "GROUP BY value",
    "ORDER BY count DESC",
    `LIMIT ${limit}`,
  ];

  return clauses.join(" ");
}

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

function createMetricCards(
  items: Array<{ label: string; result: HogQLCountResult; suffix?: string }>,
): AnalyticsCard[] {
  return items.map((item) => ({
    label: item.label,
    value: getCountFromResult(item.result),
    suffix: item.suffix,
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
    newsletterSubscribed,
    firstSubscriberCaptured,
    dashboardSessions,
    setupSteps,
    marketingCtaSources,
    betaRequestSources,
    checkoutSources,
    newsletterSources,
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
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("newsletter_subscribed", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("first_subscriber_captured", range) }),
    queryPostHog<HogQLCountResult>({ kind: "HogQLQuery", query: buildEventCountQuery("dashboard_session_started", range) }),
    queryPostHog<HogQLCountResult>({
      kind: "HogQLQuery",
      query: buildEventBreakdownQuery("project_setup_step_completed", range, "step", 5),
    }),
    queryPostHog<HogQLCountResult>({
      kind: "HogQLQuery",
      query: buildBreakdownQuery("lumina_cta_clicked", range, "source", 6),
    }),
    queryPostHog<HogQLCountResult>({
      kind: "HogQLQuery",
      query: buildBreakdownQuery("lumina_beta_request_submitted", range, "source", 6),
    }),
    queryPostHog<HogQLCountResult>({
      kind: "HogQLQuery",
      query: buildBreakdownQuery("checkout_started", range, "source", 6),
    }),
    queryPostHog<HogQLCountResult>({
      kind: "HogQLQuery",
      query: buildBreakdownQuery("newsletter_subscribed", range, "source", 6),
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
        cards: createMetricCards([
          { label: "Setup started", result: setupStarted },
          { label: "Setup completed", result: setupCompleted },
          { label: "Setup skipped", result: setupSkipped },
          { label: "Pricing configured", result: pricingConfigured },
          { label: "Newsletter configured", result: newsletterConfigured },
          { label: "First posts published", result: firstPostPublished },
        ]),
        funnel: [
          { label: "Setup started", value: startedCount },
          { label: "Pricing configured", value: getCountFromResult(pricingConfigured) },
          { label: "Newsletter configured", value: getCountFromResult(newsletterConfigured) },
          { label: "First posts published", value: getCountFromResult(firstPostPublished) },
          { label: "Setup completed", value: completedCount },
        ],
        breakdown: toBreakdownRows(setupSteps),
      },
      acquisition: {
        cards: createMetricCards([
          { label: "Lumina page views", result: marketingViews },
          { label: "CTA clicks", result: marketingCtas },
          { label: "Beta requests", result: betaRequests },
        ]),
        funnel: [
          { label: "Marketing views", value: marketingViewsCount },
          { label: "CTA clicks", value: marketingCtasCount },
          { label: "Beta requests", value: betaRequestCount },
        ],
        breakdown: toBreakdownRows(marketingCtaSources),
        secondaryBreakdown: toBreakdownRows(betaRequestSources),
      },
      monetization: {
        cards: createMetricCards([
          { label: "Paywall CTA clicks", result: paywallClicks },
          { label: "Checkout starts", result: checkoutStarted },
          { label: "Checkout completions", result: checkoutCompleted },
          { label: "Billing portal opens", result: billingPortalOpened },
          { label: "Canceled subscriptions", result: subscriptionCanceled },
        ]),
        funnel: [
          { label: "Paywall CTA clicks", value: getCountFromResult(paywallClicks) },
          { label: "Checkout starts", value: checkoutStartedCount },
          { label: "Checkout completions", value: checkoutCompletedCount },
        ],
        breakdown: toBreakdownRows(checkoutSources),
      },
      publication: {
        cards: createMetricCards([
          { label: "Newsletter campaigns sent", result: newsletterCampaignSent },
          { label: "Newsletter subscribers", result: newsletterSubscribed },
          { label: "First subscribers captured", result: firstSubscriberCaptured },
          { label: "First posts published", result: firstPostPublished },
        ]),
        breakdown: toBreakdownRows(newsletterSources),
      },
      operations: {
        cards: [
          { label: "Dashboard sessions", value: dashboardSessionCount },
          { label: "Setup skipped", value: skippedCount },
          { label: "Billing portal opens", value: getCountFromResult(billingPortalOpened) },
        ],
      },
    },
    summary: compactAnalyticsProperties({
      setup_completion_rate:
        startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
      marketing_to_cta_rate:
        marketingViewsCount > 0 ? Math.round((marketingCtasCount / marketingViewsCount) * 100) : 0,
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
