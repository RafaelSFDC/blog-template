import { usePostHog } from "@posthog/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthorBio } from "#/components/author-bio";
import { BlogHero } from "#/components/blog-hero";
import { CommentForm } from "#/components/blog/comment-form";
import { CommentList } from "#/components/blog/comment-list";
import { Newsletter } from "#/components/blog/newsletter";
import { Paywall } from "#/components/blog/paywall";
import { MarkdownContent } from "#/components/markdown-content";
import { RecommendedPosts } from "#/components/recommended-posts";
import { SocialSharing } from "#/components/social-sharing";
import { TableOfContents } from "#/components/table-of-contents";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildPublicSeo,
  resolvePublicIndexability,
} from "#/lib/seo";
import { captureClientEvent } from "#/lib/analytics-client";
import { captureClientException } from "#/lib/sentry-client";
import { addPublicComment, getPublicPostBySlug } from "#/server/public/content";

type PostBySlugData = Awaited<ReturnType<typeof getPublicPostBySlug>>;

export const Route = createFileRoute("/_public/blog/$slug")({
  loader: ({ params }) => getPublicPostBySlug({ data: params.slug }),
  head: ({ loaderData }) => {
    const data = loaderData as PostBySlugData;
    const post = data?.post;
    const site = data?.site;

    if (!post || !site) {
      return {};
    }

    return buildPublicSeo({
      site,
      path: `/blog/${post.slug}`,
      title: `${post.metaTitle || post.title} | ${site.blogName}`,
      description: post.metaDescription || post.excerpt || site.blogDescription,
      image: post.ogImage || post.coverImage || site.defaultOgImage,
      type: "article",
      indexable: resolvePublicIndexability({
        site,
        seoNoIndex: post.seoNoIndex,
        isPremium: post.isPremium,
        hasAccess: data.hasAccess,
      }),
      jsonLd: [
        buildOrganizationJsonLd(site),
        buildBreadcrumbJsonLd(site.siteUrl, [
          { name: "Stories", path: "/blog" },
          ...(post.category && post.categorySlug
            ? [{ name: post.category, path: `/blog/category/${post.categorySlug}` }]
            : []),
          { name: post.title, path: `/blog/${post.slug}` },
        ]),
        buildArticleJsonLd({
          site,
          post: {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            slug: post.slug,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            coverImage: post.coverImage,
            ogImage: post.ogImage,
            author: post.authorName
              ? {
                  name: post.authorName,
                  slug: post.authorSlug,
                }
              : null,
          },
        }),
      ],
    });
  },
  component: PostDetail,
});

function PostDetail() {
  const { post, comments, recommended, hasAccess, defaultPlanSlug } =
    Route.useLoaderData() as PostBySlugData;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const [subscribing, setSubscribing] = useState(false);
  const posthog = usePostHog();

  async function handleSubscribe() {
    captureClientEvent(posthog, "paywall_cta_clicked", {
      post_slug: post.slug,
      post_title: post.title,
      plan_slug: defaultPlanSlug,
      surface: "public_site",
    });

    try {
      setSubscribing(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ planSlug: defaultPlanSlug }),
        headers: {
          "Content-Type": "application/json",
          "X-PostHog-Session-Id": posthog.get_session_id() ?? "",
          "X-PostHog-Distinct-Id": posthog.get_distinct_id() ?? "",
        },
      });

      if (response.status === 401) {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const data = (await response.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error(data.error || "No checkout URL received");
    } catch (error) {
      captureClientException(error, {
        tags: {
          area: "public",
          flow: "subscription-checkout",
        },
        extras: {
          postSlug: post.slug,
          planSlug: defaultPlanSlug,
        },
      });
      toast.error("Something went wrong while starting checkout. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <BlogHero post={post} />

        <div className="rounded-md border bg-card p-4 shadow-sm sm:p-6">
          <SocialSharing url={currentUrl} title={post.title} />
        </div>

        <TableOfContents content={post.content} />

        <article className="relative overflow-hidden rounded-md border bg-card p-6 shadow-sm prose-lg sm:p-12">
          <MarkdownContent content={post.content} />
          {!hasAccess ? (
            <Paywall
              onSubscribe={handleSubscribe}
              isLoading={subscribing}
              ctaHref="/pricing"
              ctaLabel="Compare plans"
            />
          ) : null}
        </article>

        <AuthorBio
          author={{
            name: post.authorName || "Lumina Editorial Team",
            image: undefined,
            bio: post.authorBio || undefined,
            role: post.authorHeadline || "Content Strategist",
            slug: post.authorSlug || undefined,
          }}
        />

        <section className="rounded-md border bg-card p-6 shadow-sm sm:p-12">
          <h3 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            Leave a Comment
          </h3>
          {post.commentsEnabled ? (
            <div className="mb-10 border-b border-border pb-10">
              <CommentForm
                onSubmit={async (data) => {
                  await addPublicComment({ data: { ...data, postId: post.id } });
                }}
              />
            </div>
          ) : (
            <div className="mb-10 rounded-md border border-dashed border-border/60 bg-muted/20 p-6 text-sm font-medium text-muted-foreground">
              Comments are currently disabled for this story.
            </div>
          )}

          <h3 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
            Discussion ({comments?.length || 0})
          </h3>
          <CommentList comments={comments} />
        </section>

        <Newsletter />
        <RecommendedPosts posts={recommended} />
      </div>
    </main>
  );
}
