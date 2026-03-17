import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryPostHog: vi.fn(),
}));

vi.mock("#/server/analytics", () => ({
  queryPostHog: mocks.queryPostHog,
}));

import { getAnalyticsDashboard } from "#/server/analytics-dashboard";

function countResult(value: number) {
  return { results: [[value] as [number]] };
}

function breakdownResult(rows: Array<[string, number]>) {
  return { results: rows };
}

describe("analytics dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.POSTHOG_PERSONAL_API_KEY = "test-posthog-key";
    process.env.VITE_POSTHOG_PROJECT_ID = "123";
  });

  it("returns a launch-focused dashboard with funnels and breakdowns", async () => {
    mocks.queryPostHog
      .mockResolvedValueOnce(countResult(10))
      .mockResolvedValueOnce(countResult(6))
      .mockResolvedValueOnce(countResult(2))
      .mockResolvedValueOnce(countResult(7))
      .mockResolvedValueOnce(countResult(5))
      .mockResolvedValueOnce(countResult(4))
      .mockResolvedValueOnce(countResult(120))
      .mockResolvedValueOnce(countResult(48))
      .mockResolvedValueOnce(countResult(12))
      .mockResolvedValueOnce(countResult(18))
      .mockResolvedValueOnce(countResult(9))
      .mockResolvedValueOnce(countResult(3))
      .mockResolvedValueOnce(countResult(5))
      .mockResolvedValueOnce(countResult(22))
      .mockResolvedValueOnce(countResult(14))
      .mockResolvedValueOnce(countResult(9))
      .mockResolvedValueOnce(countResult(8))
      .mockResolvedValueOnce(countResult(31))
      .mockResolvedValueOnce(countResult(1))
      .mockResolvedValueOnce(countResult(19))
      .mockResolvedValueOnce(countResult(4))
      .mockResolvedValueOnce(
        breakdownResult([
          ["identity", 6],
          ["pricing", 5],
          ["newsletter", 3],
        ]),
      )
      .mockResolvedValueOnce(
        breakdownResult([
          ["marketing_header", 20],
          ["hero_primary", 15],
        ]),
      )
      .mockResolvedValueOnce(
        breakdownResult([
          ["beta_form_submit", 10],
          ["pricing_page", 2],
        ]),
      )
      .mockResolvedValueOnce(
        breakdownResult([
          ["pricing_page", 11],
          ["paywall", 7],
        ]),
      )
      .mockResolvedValueOnce(
        breakdownResult([
          ["site_form", 20],
          ["paywall_teaser", 11],
        ]),
      )
      .mockResolvedValueOnce(
        breakdownResult([
          ["pricing_page", 8],
          ["paywall", 6],
        ]),
      )
      .mockResolvedValueOnce(
        breakdownResult([
          ["account_free_reader", 3],
          ["account_past_due", 1],
        ]),
      );

    const dashboard = await getAnalyticsDashboard("30d");
    expect(dashboard.sections).not.toBeNull();
    const sections = dashboard.sections!;

    expect(dashboard.isConfigured).toBe(true);
    expect(mocks.queryPostHog).toHaveBeenCalledTimes(28);
    expect(dashboard.summary).toMatchObject({
      setup_completion_rate: 60,
      marketing_to_cta_rate: 40,
      marketing_to_beta_rate: 10,
      checkout_completion_rate: 50,
    });
    expect(sections.activation.funnel).toEqual([
      { label: "Setup started", value: 10 },
      { label: "Pricing configured", value: 7 },
      { label: "Newsletter configured", value: 5 },
      { label: "First posts published", value: 4 },
      { label: "Setup completed", value: 6 },
    ]);
    expect(sections.activation.breakdown[0]).toEqual({
      label: "identity",
      count: 6,
    });
    expect(sections.acquisition.secondaryBreakdown?.[0]).toEqual({
      label: "beta_form_submit",
      count: 10,
    });
    expect(sections.monetization.breakdown[1]).toEqual({
      label: "paywall",
      count: 7,
    });
    expect(sections.monetization.secondaryBreakdown?.[0]).toEqual({
      label: "pricing_page",
      count: 8,
    });
    expect(sections.operations.breakdown?.[0]).toEqual({
      label: "account_free_reader",
      count: 3,
    });
    expect(sections.publication.cards).toEqual([
      { label: "Newsletter campaigns sent", value: 8, suffix: undefined },
      { label: "Newsletter subscribers", value: 31, suffix: undefined },
      { label: "First subscribers captured", value: 1, suffix: undefined },
      { label: "First posts published", value: 4, suffix: undefined },
    ]);
  });

  it("returns a clear fallback when PostHog is not configured", async () => {
    delete process.env.POSTHOG_PERSONAL_API_KEY;
    delete process.env.VITE_POSTHOG_PROJECT_ID;

    const dashboard = await getAnalyticsDashboard("7d");

    expect(dashboard).toMatchObject({
      isConfigured: false,
      range: "7d",
      sections: null,
    });
    expect(mocks.queryPostHog).not.toHaveBeenCalled();
  });
});
