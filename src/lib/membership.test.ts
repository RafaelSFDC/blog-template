import { describe, expect, it } from "vitest";
import {
  getEffectiveSubscriptionStatus,
  getEntitlementAccess,
  hasPremiumEntitlement,
  mapStripeStatusToSubscriptionStatus,
  resolveTeaserContent,
} from "#/lib/membership";

describe("membership helpers", () => {
  it("grants access to active and grace-period subscriptions", () => {
    expect(hasPremiumEntitlement("active")).toBe(true);
    expect(hasPremiumEntitlement("past_due")).toBe(true);
    expect(hasPremiumEntitlement("expired")).toBe(false);
  });

  it("expires canceled subscriptions after period end", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");

    expect(
      getEffectiveSubscriptionStatus(
        {
          status: "canceled",
          currentPeriodEnd: new Date("2026-03-16T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("canceled");

    expect(
      getEffectiveSubscriptionStatus(
        {
          status: "canceled",
          currentPeriodEnd: new Date("2026-03-14T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("expired");
  });

  it("ends past_due access after grace period", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");

    expect(
      getEffectiveSubscriptionStatus(
        {
          status: "past_due",
          gracePeriodEndsAt: new Date("2026-03-16T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("past_due");

    expect(
      getEffectiveSubscriptionStatus(
        {
          status: "past_due",
          gracePeriodEndsAt: new Date("2026-03-14T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("expired");
  });

  it("computes teaser access for premium content without entitlement", () => {
    expect(
      getEntitlementAccess({
        isPremium: true,
        hasEntitlement: false,
        isAdmin: false,
      }),
    ).toBe("teaser");
  });

  it("maps Stripe statuses into local subscription statuses", () => {
    expect(mapStripeStatusToSubscriptionStatus("active")).toBe("active");
    expect(mapStripeStatusToSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeStatusToSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapStripeStatusToSubscriptionStatus("unpaid")).toBe("past_due");
  });

  it("uses excerpt first and falls back to truncated content", () => {
    expect(
      resolveTeaserContent({
        content: "Full body content",
        excerpt: "Short teaser",
        teaserMode: "excerpt",
      }),
    ).toBe("Short teaser");

    expect(
      resolveTeaserContent({
        content: "A".repeat(800),
        excerpt: "",
        teaserMode: "truncate",
      }),
    ).toHaveLength(483);
  });
});
