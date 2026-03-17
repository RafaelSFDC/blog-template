import { beforeEach, describe, expect, it, vi } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

const mocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
}));

vi.mock("#/server/stripe", () => ({
  stripe: {
    subscriptions: {
      retrieve: mocks.retrieve,
    },
    prices: {
      retrieve: vi.fn().mockResolvedValue({
        object: "price",
        active: true,
        billing_scheme: "per_unit",
        created: 1_770_000_000,
        currency_options: {},
        custom_unit_amount: null,
        livemode: false,
        lookup_key: null,
        metadata: {},
        nickname: null,
        product: "prod_fixture",
        recurring: null,
        tax_behavior: "unspecified",
        tiers_mode: null,
        transform_quantity: null,
        unit_amount: 1900,
        currency: "usd",
        type: "one_time",
      }),
    },
  },
}));

describe("membership webhook integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores stripe events once and ignores duplicates", async () => {
    await withIsolatedDatabase("stripe-webhook", async () => {
      const { db } = await import("#/server/db/index");
      const { appSettings, user } = await import("#/server/db/schema");
      const { processStripeWebhookEvent } = await import("#/server/actions/membership-actions");

      await db.insert(user).values({
        id: "member-1",
        name: "Member One",
        email: "member@example.com",
        role: "reader",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(appSettings).values([
        { key: "stripeMonthlyPriceId", value: "price_monthly", updatedAt: new Date() },
        { key: "stripeAnnualPriceId", value: "price_annual", updatedAt: new Date() },
      ]);

      mocks.retrieve.mockResolvedValue({
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
        items: {
          data: [
            {
              price: { id: "price_monthly" },
              current_period_start: 1_773_014_400,
              current_period_end: 1_775_692_800,
            },
          ],
        },
      });

      const event = {
        id: "evt_fixture_checkout",
        type: "checkout.session.completed",
        data: {
          object: {
            customer: "cus_123",
            subscription: "sub_123",
            customer_email: "member@example.com",
            metadata: {
              userId: "member-1",
              planSlug: "monthly",
            },
          },
        },
      };

      const first = await processStripeWebhookEvent(event);
      const duplicate = await processStripeWebhookEvent(event);

      expect(first).toEqual({ processed: true, duplicate: false });
      expect(duplicate).toEqual({ processed: false, duplicate: true });
    });
  }, 15000);
});

