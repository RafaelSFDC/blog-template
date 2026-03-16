import { z } from "zod";

export const analyticsRangeSchema = z.enum(["7d", "30d", "90d"]);

export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;

export const ANALYTICS_RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const analyticsRangeOptions: Array<{
  value: AnalyticsRange;
  label: string;
}> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export type AnalyticsSurface =
  | "dashboard"
  | "dashboard_setup"
  | "public_site"
  | "lumina_marketing"
  | "checkout"
  | "newsletter"
  | "auth"
  | "billing";

export type AnalyticsEventPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[];

export type AnalyticsEventProperties = Record<
  string,
  AnalyticsEventPropertyValue
>;

export interface AnalyticsEventDefinition {
  category:
    | "marketing"
    | "setup"
    | "editorial"
    | "newsletter"
    | "revenue"
    | "auth"
    | "retention";
  description: string;
  properties: string[];
  legacyEvents?: string[];
}

export const analyticsEventDefinitions = {
  lumina_marketing_page_view: {
    category: "marketing",
    description: "A Lumina marketing page was viewed.",
    properties: ["surface", "path", "source"],
  },
  lumina_cta_clicked: {
    category: "marketing",
    description: "A CTA on the Lumina marketing surface was clicked.",
    properties: ["surface", "path", "cta_label", "cta_href", "source"],
  },
  lumina_beta_request_submitted: {
    category: "marketing",
    description: "A Lumina beta request was submitted.",
    properties: ["role", "publication_type", "current_stack", "path", "source", "surface"],
  },
  project_setup_started: {
    category: "setup",
    description: "An admin started the first-run setup wizard.",
    properties: ["actor_user_id", "user_role", "surface"],
  },
  project_setup_step_completed: {
    category: "setup",
    description: "A setup wizard step was completed.",
    properties: ["actor_user_id", "step", "site_preset_key", "surface"],
  },
  project_setup_skipped: {
    category: "setup",
    description: "The setup wizard was skipped.",
    properties: ["actor_user_id", "user_role", "surface"],
  },
  project_setup_completed: {
    category: "setup",
    description: "The setup wizard was completed.",
    properties: ["actor_user_id", "site_preset_key", "starter_content_generated", "surface"],
  },
  starter_content_generated: {
    category: "setup",
    description: "Starter drafts were generated.",
    properties: ["created_pages", "created_welcome_post", "site_preset_key", "surface"],
  },
  pricing_configured: {
    category: "setup",
    description: "Pricing configuration was saved.",
    properties: ["has_monthly_price", "has_annual_price", "surface"],
  },
  newsletter_configured: {
    category: "setup",
    description: "Newsletter configuration was saved.",
    properties: ["has_sender_email", "double_opt_in_enabled", "surface"],
  },
  first_post_published: {
    category: "editorial",
    description: "The first post was published on the publication.",
    properties: ["post_id", "post_slug", "post_title", "actor_user_id", "surface"],
  },
  first_subscriber_captured: {
    category: "newsletter",
    description: "The first newsletter subscriber was captured.",
    properties: ["subscriber_id", "source", "surface"],
  },
  checkout_started: {
    category: "revenue",
    description: "A paid membership checkout flow started.",
    properties: ["plan_slug", "source", "surface", "path", "post_slug"],
    legacyEvents: ["subscription_checkout_started", "pricing_checkout_started"],
  },
  checkout_completed: {
    category: "revenue",
    description: "A paid membership checkout completed.",
    properties: ["plan_slug", "stripe_subscription_id", "stripe_customer_id", "surface"],
    legacyEvents: ["subscription_activated"],
  },
  billing_portal_opened: {
    category: "revenue",
    description: "A user opened the Stripe billing portal.",
    properties: ["user_id", "stripe_customer_id", "account_retention_state", "source", "surface"],
  },
  subscription_canceled: {
    category: "revenue",
    description: "A membership subscription was canceled.",
    properties: ["stripe_customer_id", "stripe_subscription_id", "surface"],
  },
  paywall_cta_clicked: {
    category: "revenue",
    description: "A paywall CTA was clicked from a post detail page.",
    properties: ["plan_slug", "post_slug", "post_title", "surface"],
  },
  newsletter_campaign_sent: {
    category: "newsletter",
    description: "A newsletter campaign entered the send flow.",
    properties: ["newsletter_id", "campaign_segment", "surface"],
    legacyEvents: ["newsletter_campaign_queued"],
  },
  newsletter_subscribed: {
    category: "newsletter",
    description: "A newsletter subscription was created.",
    properties: ["subscriber_id", "email", "source", "surface"],
    legacyEvents: ["newsletter_pending_confirmation"],
  },
  newsletter_confirmed: {
    category: "newsletter",
    description: "A newsletter subscription was confirmed.",
    properties: ["subscriber_id", "surface"],
  },
  newsletter_unsubscribed: {
    category: "newsletter",
    description: "A newsletter subscription was canceled by the user.",
    properties: ["subscriber_id", "surface"],
  },
  newsletter_opened: {
    category: "newsletter",
    description: "A newsletter delivery was opened.",
    properties: ["newsletter_id", "delivery_id", "surface"],
  },
  newsletter_clicked: {
    category: "newsletter",
    description: "A link inside a newsletter was clicked.",
    properties: ["newsletter_id", "delivery_id", "surface", "path"],
  },
  dashboard_session_started: {
    category: "retention",
    description: "A dashboard session started.",
    properties: ["surface", "path", "user_role"],
  },
  user_signed_in: {
    category: "auth",
    description: "A user signed in.",
    properties: ["method", "surface"],
  },
  user_signed_up: {
    category: "auth",
    description: "A user signed up.",
    properties: ["method", "surface"],
  },
} satisfies Record<string, AnalyticsEventDefinition>;

export type AnalyticsEventName = keyof typeof analyticsEventDefinitions;

export const analyticsEventNames = Object.keys(
  analyticsEventDefinitions,
) as AnalyticsEventName[];

export const analyticsCommonProperties = [
  "surface",
  "path",
  "plan_slug",
  "site_preset_key",
  "step",
  "newsletter_id",
  "delivery_id",
  "campaign_segment",
  "user_role",
  "source",
] as const;

export function compactAnalyticsProperties<T extends AnalyticsEventProperties>(
  properties: T,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as T;
}

export function getLegacyEventNames(event: AnalyticsEventName) {
  return analyticsEventDefinitions[event].legacyEvents ?? [];
}

export function resolveAnalyticsRange(
  value: string | undefined | null,
): AnalyticsRange {
  const parsed = analyticsRangeSchema.safeParse(value);
  return parsed.success ? parsed.data : "30d";
}

export function buildPostHogDateFilter(range: AnalyticsRange) {
  return `timestamp >= now() - INTERVAL ${ANALYTICS_RANGE_DAYS[range]} DAY`;
}

export function buildEventCountQuery(
  event: AnalyticsEventName,
  range: AnalyticsRange,
  extraFilters?: string[],
) {
  const filters = [buildPostHogDateFilter(range), `event = '${event}'`];
  if (extraFilters) {
    filters.push(...extraFilters);
  }

  return `SELECT count() FROM events WHERE ${filters.join(" AND ")}`;
}

export function buildEventBreakdownQuery(
  event: AnalyticsEventName,
  range: AnalyticsRange,
  property: string,
  limit = 10,
) {
  return [
    `SELECT properties['${property}'] AS value, count() AS count`,
    "FROM events",
    `WHERE ${buildPostHogDateFilter(range)} AND event = '${event}'`,
    "GROUP BY value",
    "ORDER BY count DESC",
    `LIMIT ${limit}`,
  ].join(" ");
}
