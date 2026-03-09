import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY is not defined in environment variables. Using placeholder key.",
  );
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-02-25.clover", // Updated to a more standard stable version if possible, or keep as is if specific
  typescript: true,
});
