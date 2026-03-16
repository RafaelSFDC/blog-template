import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
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
        unit_amount: 1900,
        currency: "usd",
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
      const { db } = await import("#/db/index");
      const { appSettings, user } = await import("#/db/schema");
      const { processStripeWebhookEvent } = await import("#/server/membership-actions");

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
      } satisfies Partial<Stripe.Subscription>);

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
      } as Stripe.Event;

      const first = await processStripeWebhookEvent(event);
      const duplicate = await processStripeWebhookEvent(event);

      expect(first).toEqual({ processed: true, duplicate: false });
      expect(duplicate).toEqual({ processed: false, duplicate: true });
    });
  });
});
