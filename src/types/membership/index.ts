import type { z } from "zod";
import { subscriptionStatusSchema } from "#/schemas/membership";

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type EntitlementAccess = "full" | "teaser" | "none";
