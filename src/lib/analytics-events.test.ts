import { describe, expect, it } from "vitest";
import {
  analyticsEventDefinitions,
  analyticsEventNames,
  buildEventBreakdownQuery,
  buildEventCountQuery,
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

  it("falls back to 30d when the range is invalid", () => {
    expect(resolveAnalyticsRange("invalid")).toBe("30d");
    expect(resolveAnalyticsRange("90d")).toBe("90d");
  });
});
