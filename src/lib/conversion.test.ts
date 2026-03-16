import { describe, expect, it } from "vitest";
import {
  buildAccountRetentionState,
  buildPricingComparison,
  resolvePaywallVariant,
} from "#/lib/conversion";

describe("conversion helpers", () => {
  it("resolves premium-publication paywalls to exclusivity copy", () => {
    expect(
      resolvePaywallVariant({
        sitePresetKey: "premium-publication",
        teaserMode: "excerpt",
        isPremium: true,
      }),
    ).toBe("membership-exclusivity");
  });

  it("calculates annual savings and recommended plan", () => {
    const comparison = buildPricingComparison({
      plans: [
        {
          slug: "monthly",
          name: "Monthly",
          description: "Monthly access",
          interval: "month",
          priceCents: 1000,
          currency: "usd",
          isDefault: false,
          isActive: true,
        },
        {
          slug: "annual",
          name: "Annual",
          description: "Annual access",
          interval: "year",
          priceCents: 9600,
          currency: "usd",
          isDefault: true,
          isActive: true,
        },
      ],
    });

    expect(comparison.recommendedPlanSlug).toBe("annual");
    expect(comparison.annualSavingsLabel).toContain("Save");
  });

  it("builds save-oriented retention for past due subscriptions", () => {
    const state = buildAccountRetentionState({
      effectiveStatus: "past_due",
      hasBillingPortal: true,
    });

    expect(state.key).toBe("past_due");
    expect(state.primaryAction.kind).toBe("billing_portal");
    expect(state.title).toContain("risk");
  });
});
