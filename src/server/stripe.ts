import Stripe from "stripe";
import { resolveStripeSecretKey } from "#/server/system/runtime-config";

const stripeKey = resolveStripeSecretKey();

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "STRIPE_SECRET_KEY is not defined; using development fallback key outside strict environments.",
  );
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});
