import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { usePostHog } from "@posthog/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContent } from "#/components/cms/PageContent";
import { auth } from "#/lib/auth";
import { resolveTeaserContent } from "#/lib/membership";
import {
  buildOrganizationJsonLd,
  buildPublicSeo,
  resolvePublicCacheControl,
  resolvePublicIndexability,
} from "#/lib/seo";
import { captureClientException } from "#/lib/sentry-client";
import { getPricingPlansData, getUserEntitlement } from "#/server/membership-actions";
import { getRedirectByPath } from "#/server/redirect-actions";
import { getPublishedPageBySlug } from "#/server/page-actions";
import { getSeoSiteData } from "#/server/seo-actions";

const getPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = request
      ? await auth.api.getSession({
          headers: request.headers,
        })
      : null;

    setResponseHeader(
      "Cache-Control",
      resolvePublicCacheControl({
        hasSession: Boolean(session),
        ttlSeconds: 300,
        staleSeconds: 600,
      }),
    );

    const page = await getPublishedPageBySlug(data);
    if (!page) {
      const redirectMatch = await getRedirectByPath(`/${data}`);
      if (redirectMatch) {
        throw redirect({
          href: redirectMatch.destinationPath,
          statusCode: redirectMatch.statusCode,
        });
      }
      throw notFound();
    }

    const entitlement = await getUserEntitlement({
      userId: session?.user?.id,
      role: session?.user?.role,
      isPremium: Boolean(page.isPremium),
    });
    const plans = await getPricingPlansData();
    const defaultPlan =
      plans.find((plan) => plan.isDefault && plan.isActive) ??
      plans.find((plan) => plan.slug === "annual" && plan.isActive) ??
      plans.find((plan) => plan.slug === "monthly" && plan.isActive);

    return {
      page: {
        ...page,
        content:
          entitlement.access === "full"
            ? page.content
            : resolveTeaserContent({
                content: page.content,
                excerpt: page.excerpt,
                teaserMode: page.teaserMode ?? "excerpt",
              }),
      },
      hasAccess: entitlement.access === "full",
      defaultPlanSlug: defaultPlan?.slug === "monthly" ? "monthly" : "annual",
    };
  });

export const Route = createFileRoute("/_public/$")({
  loader: async ({ params }) => {
    const [payload, site] = await Promise.all([
      getPageBySlug({ data: params._splat || "" }),
      getSeoSiteData(),
    ]);

    return { ...payload, site };
  },
  head: ({ loaderData }) => {
    const data = loaderData as
      | {
          page: {
            slug: string;
            title: string;
            metaTitle?: string | null;
            excerpt?: string | null;
            metaDescription?: string | null;
            ogImage?: string | null;
            isPremium?: boolean | null;
            seoNoIndex?: boolean | null;
          };
          hasAccess: boolean;
          site: Awaited<ReturnType<typeof getSeoSiteData>>;
        }
      | undefined;
    const page = data?.page;
    const site = data?.site;

    if (!page || !site) {
      return {};
    }

    return buildPublicSeo({
      site,
      path: page.slug === "" ? "/" : `/${page.slug}`,
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || site.blogDescription,
      image: page.ogImage || site.defaultOgImage,
      indexable: resolvePublicIndexability({
        site,
        seoNoIndex: page.seoNoIndex,
        isPremium: page.isPremium,
        hasAccess: data.hasAccess,
      }),
      jsonLd: [buildOrganizationJsonLd(site)],
    });
  },
  component: CmsPage,
});

function CmsPage() {
  const { page, hasAccess, defaultPlanSlug } = Route.useLoaderData();
  const [subscribing, setSubscribing] = useState(false);
  const posthog = usePostHog();

  async function handleSubscribe() {
    try {
      setSubscribing(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PostHog-Session-Id": posthog.get_session_id() ?? "",
          "X-PostHog-Distinct-Id": posthog.get_distinct_id() ?? "",
        },
        body: JSON.stringify({ planSlug: defaultPlanSlug }),
      });

      if (response.status === 401) {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const data = (await response.json()) as { url?: string; error?: string };
      if (!data.url) {
        throw new Error(data.error || "No checkout URL received");
      }

      window.location.href = data.url;
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "public",
          flow: "page-subscription-checkout",
        },
        extras: {
          pageSlug: page.slug,
          planSlug: defaultPlanSlug,
        },
      });
      toast.error("Could not start checkout right now. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <PageContent
      title={page.title}
      description={page.excerpt}
      content={page.content}
      showPaywall={Boolean(page.isPremium) && !hasAccess}
      onSubscribe={handleSubscribe}
      isSubscribing={subscribing}
      ctaHref="/pricing"
      ctaLabel="Compare plans"
    />
  );
}
