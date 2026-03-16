import { usePostHog } from "@posthog/react";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { useState } from "react";
import { toast } from "sonner";
import { AuthorBio } from "#/components/author-bio";
import { BlogHero } from "#/components/blog-hero";
import { CommentForm } from "#/components/blog/comment-form";
import { CommentList } from "#/components/blog/comment-list";
import { Newsletter } from "#/components/blog/newsletter";
import { Paywall } from "#/components/blog/paywall";
import { type Post as PostSummary } from "#/components/blog/PostCard";
import { MarkdownContent } from "#/components/markdown-content";
import { RecommendedPosts } from "#/components/recommended-posts";
import { SocialSharing } from "#/components/social-sharing";
import { TableOfContents } from "#/components/table-of-contents";
import { comments, posts } from "#/db/schema";
import { db } from "#/db/index";
import type { Comment as BlogComment } from "#/components/blog/comment-list";
import { auth } from "#/lib/auth";
import { publicCommentSchema } from "#/lib/cms-schema";
import { resolveTeaserContent } from "#/lib/membership";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildPublicSeo,
  getPrivateCacheControl,
  getPublicCacheControl,
} from "#/lib/seo";
import { captureClientException } from "#/lib/sentry-client";
import { createPendingComment } from "#/server/comment-actions";
import { getPricingPlansData, getUserEntitlement } from "#/server/membership-actions";
import { getRelatedPostsByTaxonomy } from "#/server/public-discovery";
import { getRedirectByPath } from "#/server/redirect-actions";
import { getSeoSiteData } from "#/server/seo-actions";

type PostWithExtras = PostSummary & {
  content: string;
  isPremium: boolean | null;
  teaserMode?: string | null;
  status: string;
  readingTime?: number | null;
  authorName?: string | null;
  authorSlug?: string | null;
  authorBio?: string | null;
  authorHeadline?: string | null;
  categorySlug?: string | null;
  updatedAt?: Date | string | null;
  seoNoIndex?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
};

interface PostBySlugData {
  post: PostWithExtras;
  comments: BlogComment[];
  recommended: PostSummary[];
  hasAccess: boolean;
  entitlementStatus: string;
  defaultPlanSlug: "monthly" | "annual";
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
}

const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const request = getRequest();
    const session = request
      ? await auth.api.getSession({
          headers: request.headers,
        })
      : null;

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      with: {
        author: {
          columns: {
            name: true,
            publicAuthorSlug: true,
            authorBio: true,
            authorHeadline: true,
          },
        },
        postCategories: {
          with: {
            category: {
              columns: {
                name: true,
                slug: true,
              },
            },
          },
          limit: 1,
        },
      },
    });

    if (!post) {
      const redirectMatch = await getRedirectByPath(`/blog/${slug}`);
      if (redirectMatch) {
        throw redirect({
          href: redirectMatch.destinationPath,
          statusCode: redirectMatch.statusCode,
        });
      }
      throw notFound();
    }

    if (session) {
      setResponseHeader("Cache-Control", getPrivateCacheControl());
    } else {
      setResponseHeader("Cache-Control", getPublicCacheControl(3600, 86400));
    }

    if (post.status !== "published" && session?.user?.role !== "admin" && session?.user?.role !== "super-admin") {
      throw notFound();
    }

    const entitlement = await getUserEntitlement({
      userId: session?.user?.id,
      role: session?.user?.role,
      isPremium: Boolean(post.isPremium),
    });

    const hasAccess = entitlement.access === "full";
    const plans = await getPricingPlansData();
    const defaultPlan =
      plans.find((plan) => plan.isDefault && plan.isActive) ??
      plans.find((plan) => plan.slug === "annual" && plan.isActive) ??
      plans.find((plan) => plan.slug === "monthly" && plan.isActive);

    const postForView = {
      ...post,
      authorName: post.author?.name ?? "Editorial Team",
      authorSlug: post.author?.publicAuthorSlug ?? null,
      authorBio: post.author?.authorBio ?? null,
      authorHeadline: post.author?.authorHeadline ?? null,
      category: post.postCategories[0]?.category?.name ?? null,
      categorySlug: post.postCategories[0]?.category?.slug ?? null,
      content: hasAccess
        ? post.content
        : resolveTeaserContent({
            content: post.content,
            excerpt: post.excerpt,
            teaserMode: post.teaserMode ?? "excerpt",
          }),
    } as PostWithExtras;

    const commentsList = await db.query.comments
      .findMany({
        where: and(eq(comments.postId, post.id), eq(comments.status, "approved")),
        orderBy: [desc(comments.createdAt)],
      })
      .catch(() => []);

    const recommended = await getRelatedPostsByTaxonomy(post.id);

    const site = await getSeoSiteData();

    return {
      post: postForView,
      comments: commentsList,
      recommended: (recommended as PostSummary[]) || [],
      hasAccess,
      entitlementStatus: entitlement.status,
      defaultPlanSlug: (defaultPlan?.slug === "monthly" ? "monthly" : "annual"),
      site,
    } satisfies PostBySlugData;
  });

const addComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicCommentSchema.parse(input))
  .handler(async ({ data }) => {
    await createPendingComment(data);
    return { success: true };
  });

export const Route = createFileRoute("/_public/blog/$slug")({
  loader: ({ params }) => getPostBySlug({ data: params.slug }),
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
      indexable:
        site.robotsIndexingEnabled &&
        !post.seoNoIndex &&
        (!post.isPremium || data.hasAccess),
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
    posthog.capture("subscription_checkout_started", {
      post_slug: post.slug,
      post_title: post.title,
      plan_slug: defaultPlanSlug,
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
          <div className="mb-10 border-b border-border pb-10">
            <CommentForm
              onSubmit={async (data) => {
                await addComment({ data: { ...data, postId: post.id } });
                posthog.capture("post_comment_submitted", {
                  post_slug: post.slug,
                  post_title: post.title,
                });
              }}
            />
          </div>

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
