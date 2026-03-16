import { describe, expect, it } from "vitest";
import {
  analyticsEventDefinitions,
  analyticsEventNames,
  buildEventBreakdownQuery,
  buildEventCountQuery,
  getLegacyEventNames,
  resolveAnalyticsRange,
} from "#/lib/analytics-events";

describe("analytics events", () => {
  it("exposes canonical snake_case event names", () => {
    expect(analyticsEventNames.length).toBeGreaterThan(10);
    for (const name of analyticsEventNames) {
      expect(name).toMatch(/^[a-z0-9_]+$/);
      expect(analyticsEventDefinitions[name]).toBeDefined();
    }
  });

  it("builds event count queries with the selected date range", () => {
    const query = buildEventCountQuery("checkout_started", "30d");

    expect(query).toContain("event = 'checkout_started'");
    expect(query).toContain("INTERVAL 30 DAY");
  });

  it("builds breakdown queries for funnel diagnostics", () => {
    const query = buildEventBreakdownQuery(
      "project_setup_step_completed",
      "7d",
      "step",
      5,
    );

    expect(query).toContain("properties['step']");
    expect(query).toContain("LIMIT 5");
    expect(query).toContain("INTERVAL 7 DAY");
  });

  it("keeps launch-critical events aligned with the canonical taxonomy", () => {
    expect(analyticsEventDefinitions.lumina_marketing_page_view.properties).toEqual([
      "surface",
      "path",
      "source",
    ]);
    expect(analyticsEventDefinitions.lumina_cta_clicked.properties).toEqual([
      "surface",
      "path",
      "cta_label",
      "cta_href",
      "source",
    ]);
    expect(analyticsEventDefinitions.lumina_beta_request_submitted.properties).toEqual([
      "role",
      "publication_type",
      "current_stack",
      "path",
      "source",
      "surface",
    ]);
    expect(analyticsEventDefinitions.checkout_started.properties).toContain("path");
    expect(analyticsEventDefinitions.billing_portal_opened.properties).toEqual([
      "user_id",
      "stripe_customer_id",
      "account_retention_state",
      "source",
      "surface",
    ]);
  });

  it("limits legacy dual-write to the explicitly supported events", () => {
    expect(getLegacyEventNames("checkout_started")).toEqual([
      "subscription_checkout_started",
      "pricing_checkout_started",
    ]);
    expect(getLegacyEventNames("checkout_completed")).toEqual(["subscription_activated"]);
    expect(getLegacyEventNames("newsletter_campaign_sent")).toEqual([
      "newsletter_campaign_queued",
    ]);
    expect(getLegacyEventNames("lumina_cta_clicked")).toEqual([]);
    expect(getLegacyEventNames("project_setup_completed")).toEqual([]);
  });

  it("falls back to 30d when the range is invalid", () => {
    expect(resolveAnalyticsRange("invalid")).toBe("30d");
    expect(resolveAnalyticsRange("90d")).toBe("90d");
  });
});
