import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { auth } from "#/lib/auth";
import { resolveTeaserContent } from "#/lib/membership";
import { getPrivateCacheControl, getPublicCacheControl } from "#/lib/seo";
import { getPricingPlansData, getUserEntitlement } from "#/server/membership-actions";
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
  const request = getRequest();
  const session = request
    ? await auth.api.getSession({
        headers: request.headers,
      })
    : null;

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
  const defaultPlan =
    plans.find((plan) => plan.isDefault && plan.isActive) ??
    plans.find((plan) => plan.slug === "annual" && plan.isActive) ??
    plans.find((plan) => plan.slug === "monthly" && plan.isActive);

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
  const request = getRequest();
  const session = request
    ? await auth.api.getSession({
        headers: request.headers,
      })
    : null;

  return {
    plans: (await getPricingPlansData()).map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      priceCents: plan.priceCents,
      currency: plan.currency,
      isDefault: Boolean(plan.isDefault),
      isActive: Boolean(plan.isActive),
    })),
    isAuthenticated: Boolean(session?.user),
  };
});
