import { usePostHog } from "@posthog/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { PageContent } from "#/components/cms/PageContent";
import { buildHomepageFallbackContent } from "#/lib/site-presets";
import type { SitePresetKey } from "#/types/system";
import {
  buildOrganizationJsonLd,
  buildPublicSeo,
  resolvePublicIndexability,
} from "#/lib/seo";
import { captureClientException } from "#/lib/sentry-client";
import { getHomepage, getTopPosts } from "#/server/actions/public/site";
import { getSeoSiteData } from "#/server/actions/seo-actions";

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
          seoNoIndex?: boolean;
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
        indexable: resolvePublicIndexability({
          site,
          seoNoIndex: homepage.seoNoIndex,
          isPremium: homepage.isPremium,
          hasAccess: homepage.hasAccess,
        }),
        jsonLd: [buildOrganizationJsonLd(site)],
      });
    }

    const fallback = buildHomepageFallbackContent({
      presetKey: site.sitePresetKey,
      blogName: site.blogName,
      blogDescription: site.blogDescription,
    });

    return buildPublicSeo({
      site,
      path: "/",
      title: site.defaultMetaTitle || fallback.metaTitle,
      description: site.defaultMetaDescription || fallback.metaDescription,
      image: site.defaultOgImage,
      jsonLd: [buildOrganizationJsonLd(site)],
    });
  },
  component: Home,
});

function Home() {
  const { homepage, latestPosts, site } = Route.useLoaderData() as {
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
    site: {
      blogName: string;
      blogDescription: string;
      sitePresetKey: SitePresetKey;
    };
  };
  const [subscribing, setSubscribing] = useState(false);
  const posthog = usePostHog();
  const fallback = buildHomepageFallbackContent({
    presetKey: site.sitePresetKey,
    blogName: site.blogName,
    blogDescription: site.blogDescription,
  });

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
          <Badge variant="default">{fallback.badge}</Badge>
          <h1 className="display-title mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-5xl lg:text-7xl">
            {fallback.title} <br />
            <span className="text-primary">{fallback.description.split(".")[0]}</span>
          </h1>
          <p className="text-lg font-black text-muted-foreground md:text-xl">
            {fallback.description}
          </p>

          <Newsletter
            variant="compact"
            title={fallback.newsletterTitle}
            description={fallback.newsletterDescription}
            placeholder="Join the newsletter..."
            className="mt-12"
          />

          <div className="mt-8 flex flex-wrap gap-4 border-t border-border pt-8">
            <Link
              to={fallback.primaryCtaHref as "/blog" | "/pricing"}
              search={fallback.primaryCtaHref === "/blog" ? { q: undefined, page: 1 } : undefined}
              className="group flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
            >
              {fallback.primaryCtaText}
              <ArrowRight
                size={16}
                strokeWidth={3}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              to={fallback.secondaryCtaHref as "/blog" | "/pricing"}
              search={fallback.secondaryCtaHref === "/blog" ? { q: undefined, page: 1 } : undefined}
              className="group flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {fallback.secondaryCtaText}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <header className="mb-10 flex items-center justify-between rounded-md border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1 sm:p-8">
          <div>
            <h2 className="display-title text-2xl font-bold text-foreground sm:text-3xl">
              {fallback.featuredHeading}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{fallback.featuredDescription}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link
              to={fallback.primaryCtaHref as "/blog" | "/pricing"}
              search={fallback.primaryCtaHref === "/blog" ? { q: undefined, page: 1 } : undefined}
              className="flex items-center gap-2"
            >
              {fallback.primaryCtaText}
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
            <p className="text-muted-foreground">{fallback.emptyPostMessage}</p>
          </div>
        )}
      </section>
    </main>
  );
}

