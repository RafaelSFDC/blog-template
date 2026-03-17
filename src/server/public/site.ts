import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { getAuthSession } from "#/server/auth/session";
import { buildPricingComparison } from "#/lib/conversion";
import { resolveTeaserContent } from "#/lib/membership";
import { getPrivateCacheControl, getPublicCacheControl } from "#/lib/seo";
import { getPricingPlansData, getUserEntitlement } from "#/server/actions/membership/membership-actions";
import { getPublishedHomepage } from "#/server/page-actions";

export const getTopPosts = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", getPublicCacheControl(300, 600));
  return db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(3);
});

export const getHomepage = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAuthSession();

  if (session) {
    setResponseHeader("Cache-Control", getPrivateCacheControl());
  } else {
    setResponseHeader("Cache-Control", getPublicCacheControl(300, 600));
  }

  const homepage = await getPublishedHomepage();
  if (!homepage) {
    return null;
  }

  const entitlement = await getUserEntitlement({
    userId: session?.user?.id,
    role: session?.user?.role,
    isPremium: Boolean(homepage.isPremium),
  });
  const plans = await getPricingPlansData();
  type PricingPlan = (typeof plans)[number];
  const defaultPlan =
    plans.find((plan: PricingPlan) => plan.isDefault && plan.isActive) ??
    plans.find((plan: PricingPlan) => plan.slug === "annual" && plan.isActive) ??
    plans.find((plan: PricingPlan) => plan.slug === "monthly" && plan.isActive);

  return {
    ...homepage,
    content:
      entitlement.access === "full"
        ? homepage.content
        : resolveTeaserContent({
            content: homepage.content,
            excerpt: homepage.excerpt,
            teaserMode: homepage.teaserMode ?? "excerpt",
          }),
    hasAccess: entitlement.access === "full",
    defaultPlanSlug: defaultPlan?.slug === "monthly" ? "monthly" : "annual",
  };
});

export const getPricingPageData = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAuthSession();

  const pricingPlans = await getPricingPlansData();
  type PricingPlan = (typeof pricingPlans)[number];
  const plans = pricingPlans.map((plan: PricingPlan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      priceCents: plan.priceCents,
      currency: plan.currency,
      isDefault: Boolean(plan.isDefault),
      isActive: Boolean(plan.isActive),
    }));

  return {
    plans,
    comparison: buildPricingComparison({ plans }),
    isAuthenticated: Boolean(session?.user),
  };
});
