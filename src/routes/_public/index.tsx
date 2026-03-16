import { usePostHog } from "@posthog/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { PageContent } from "#/components/cms/PageContent";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { auth } from "#/lib/auth";
import { resolveTeaserContent } from "#/lib/membership";
import {
  buildOrganizationJsonLd,
  buildPublicSeo,
  getPrivateCacheControl,
  getPublicCacheControl,
} from "#/lib/seo";
import { captureClientException } from "#/lib/sentry-client";
import { getPricingPlansData, getUserEntitlement } from "#/server/membership-actions";
import { getPublishedHomepage } from "#/server/page-actions";
import { getSeoSiteData } from "#/server/seo-actions";

const getTopPosts = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", getPublicCacheControl(300, 600));
  return db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(3);
});

const getHomepage = createServerFn({ method: "GET" }).handler(async () => {
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

export const Route = createFileRoute("/_public/")({
  loader: async () => {
    const site = await getSeoSiteData();
    const homepage = await getHomepage();
    if (homepage) {
      return { homepage, latestPosts: [], site };
    }

    const latestPosts = await getTopPosts();
    return { homepage: null, latestPosts, site };
  },
  head: ({ loaderData }) => {
    const data = loaderData as
      | {
          homepage: {
            title: string;
            metaTitle?: string | null;
            excerpt?: string | null;
            metaDescription?: string | null;
            ogImage?: string | null;
            isPremium?: boolean | null;
            hasAccess?: boolean;
          } | null;
          site: Awaited<ReturnType<typeof getSeoSiteData>>;
        }
      | undefined;
    const homepage = data?.homepage;
    const site = data?.site;

    if (!site) {
      return {};
    }

    if (homepage) {
      return buildPublicSeo({
        site,
        path: "/",
        title: homepage.metaTitle || homepage.title,
        description: homepage.metaDescription || homepage.excerpt || site.blogDescription,
        image: homepage.ogImage || site.defaultOgImage,
        indexable:
          site.robotsIndexingEnabled &&
          !homepage.seoNoIndex &&
          (!homepage.isPremium || homepage.hasAccess),
        jsonLd: [buildOrganizationJsonLd(site)],
      });
    }

    return buildPublicSeo({
      site,
      path: "/",
      title: site.defaultMetaTitle || `${site.blogName} | Elegant Stories`,
      description:
        site.defaultMetaDescription ||
        "Join Lumina. Discover elegant stories on design, culture, and high-quality code.",
      image: site.defaultOgImage,
      jsonLd: [buildOrganizationJsonLd(site)],
    });
  },
  component: Home,
});

function Home() {
  const { homepage, latestPosts } = Route.useLoaderData() as {
    homepage:
      | {
          title: string;
          excerpt?: string | null;
          content: string;
          isPremium?: boolean | null;
          hasAccess: boolean;
          defaultPlanSlug: "monthly" | "annual";
        }
      | null;
    latestPosts: Post[];
  };
  const [subscribing, setSubscribing] = useState(false);
  const posthog = usePostHog();

  async function handleSubscribe() {
    if (!homepage) return;

    try {
      setSubscribing(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PostHog-Session-Id": posthog.get_session_id() ?? "",
          "X-PostHog-Distinct-Id": posthog.get_distinct_id() ?? "",
        },
        body: JSON.stringify({ planSlug: homepage.defaultPlanSlug }),
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
          flow: "homepage-subscription-checkout",
        },
      });
      toast.error("Could not start checkout right now. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  if (homepage) {
    return (
      <PageContent
        title={homepage.title}
        description={homepage.excerpt}
        content={homepage.content}
        showPaywall={Boolean(homepage.isPremium) && !homepage.hasAccess}
        onSubscribe={handleSubscribe}
        isSubscribing={subscribing}
        ctaHref="/pricing"
        ctaLabel="Compare plans"
      />
    );
  }

  return (
    <main className="page-wrap pb-16 pt-6">
      <section className="editorial-grid rise-in gap-8">
        <div className="relative col-span-12 overflow-hidden rounded-md border bg-card p-8 shadow-sm sm:p-10 lg:p-12">
          <Badge variant="default">Issue #01 / Spring 2026</Badge>
          <h1 className="display-title mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-5xl lg:text-7xl">
            Stories With A <br />
            <span className="text-primary">Visual Signature.</span>
          </h1>
          <p className="text-lg font-black text-muted-foreground md:text-xl">
            A bold editorial system with sharp edges, fast rendering, and a
            layout that actually has a soul.
          </p>

          <Newsletter variant="compact" placeholder="Join the newsletter..." className="mt-12" />

          <div className="mt-8 flex flex-wrap gap-4 border-t border-border pt-8">
            <Link
              to="/blog"
              search={{ q: undefined, page: 1 }}
              className="group flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
            >
              Learn More About Our Vision
              <ArrowRight
                size={16}
                strokeWidth={3}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <header className="mb-10 flex items-center justify-between rounded-md border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1 sm:p-8">
          <h2 className="display-title text-2xl font-bold text-foreground sm:text-3xl">
            Featured Articles
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/blog" search={{ q: undefined, page: 1 }} className="flex items-center gap-2">
              View All
              <ArrowRight size={16} />
            </Link>
          </Button>
        </header>

        {latestPosts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-card p-12 text-center shadow-sm">
            <p className="text-muted-foreground">
              No posts yet. Run the seed command to create your first 5 articles.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
