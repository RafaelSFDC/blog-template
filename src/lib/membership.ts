import type { z } from "zod";
import { subscriptionStatusSchema } from "#/lib/cms-schema";

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type EntitlementAccess = "full" | "teaser" | "none";

export const DEFAULT_GRACE_PERIOD_DAYS = 3;
export const MEMBERSHIP_PLAN_SLUGS = ["monthly", "annual"] as const;

export function normalizeSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case "active":
    case "past_due":
    case "canceled":
    case "expired":
      return status;
    default:
      return "inactive";
  }
}

export function mapStripeStatusToSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "inactive";
    default:
      return "inactive";
  }
}

export function getEffectiveSubscriptionStatus(input: {
  status: string | null | undefined;
  currentPeriodEnd?: Date | null;
  gracePeriodEndsAt?: Date | null;
  canceledAt?: Date | null;
}, now = new Date()): SubscriptionStatus {
  const status = normalizeSubscriptionStatus(input.status);
  const currentPeriodEnd = input.currentPeriodEnd ?? null;
  const gracePeriodEndsAt = input.gracePeriodEndsAt ?? null;

  if (status === "active") {
    return status;
  }

  if (status === "past_due") {
    if (gracePeriodEndsAt && gracePeriodEndsAt.getTime() >= now.getTime()) {
      return "past_due";
    }
    return "expired";
  }

  if (status === "canceled") {
    if (currentPeriodEnd && currentPeriodEnd.getTime() >= now.getTime()) {
      return "canceled";
    }
    return "expired";
  }

  return status;
}

export function hasPremiumEntitlement(status: SubscriptionStatus): boolean {
  return status === "active" || status === "past_due" || status === "canceled";
}

export function getEntitlementAccess(input: {
  isPremium: boolean;
  hasEntitlement: boolean;
  isAdmin: boolean;
}): EntitlementAccess {
  if (!input.isPremium) {
    return "full";
  }

  if (input.isAdmin || input.hasEntitlement) {
    return "full";
  }

  return "teaser";
}

export function resolveTeaserContent(input: {
  content: string;
  excerpt?: string | null;
  teaserMode?: string | null;
}): string {
  if (input.teaserMode === "excerpt" && input.excerpt?.trim()) {
    return input.excerpt.trim();
  }

  const trimmed = input.content.trim();
  if (trimmed.length <= 480) {
    return trimmed;
  }

  return `${trimmed.slice(0, 480).trimEnd()}...`;
}
