import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { db } from "#/db/index";
import { posts, comments, appSettings } from "#/db/schema";
import { eq, ne, desc, and } from "drizzle-orm";

import { type Post as PostSummary } from "#/components/blog/PostCard";

type PostWithExtras = PostSummary & {
  content: string;
  isPremium: boolean | null;
  status: string;
  readingTime?: number | null;
  authorName?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
};


interface PostBySlugData {
  post: PostWithExtras;
  comments: BlogComment[];
  recommended: PostSummary[];
  hasAccess: boolean;
  stripePriceId: string | undefined;
  site: Awaited<ReturnType<typeof import("#/server/seo-actions").getSeoSiteData>>;
}
import { MarkdownContent } from "#/components/markdown-content";
import { BlogHero } from "#/components/blog-hero";
import { RecommendedPosts } from "#/components/recommended-posts";
import { TableOfContents } from "#/components/table-of-contents";
import { AuthorBio } from "#/components/author-bio";
import { SocialSharing } from "#/components/social-sharing";
import { Newsletter } from "#/components/blog/newsletter";
import { CommentForm } from "#/components/blog/comment-form";
import { CommentList } from "#/components/blog/comment-list";
import { Paywall } from "#/components/blog/paywall";
import { auth } from "#/lib/auth";
import { user } from "#/db/schema";
import { useState } from "react";
import { usePostHog } from "@posthog/react";
import { toast } from "sonner";
import type { Comment as BlogComment } from "#/components/blog/comment-list";
import { publicCommentSchema } from "#/lib/cms-schema";
import { createPendingComment } from "#/server/comment-actions";
import { getRedirectByPath } from "#/server/redirect-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildPublicSeo } from "#/lib/seo";

const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const request = getRequest();

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
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

    const session = request
      ? await auth.api.getSession({
          headers: request.headers,
        })
      : null;
    
    if (session) {
      setResponseHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    } else {
      setResponseHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    }

    // If not published and not admin, hide it
    if (post.status !== "published" && session?.user?.role !== "admin") {
      throw notFound();
    }

    const isSubscribed = session?.user?.id
      ? await db.query.user
          .findFirst({
            where: eq(user.id, session.user.id),
          })
          .then(
            (u: { stripeCurrentPeriodEnd: Date | null } | undefined) =>
              !!(u?.stripeCurrentPeriodEnd &&
              u.stripeCurrentPeriodEnd > new Date()),
          )
      : false;

    const hasAccess =
      !post.isPremium || isSubscribed || session?.user?.role === "admin";

    // Truncate content if no access
    if (post.isPremium && !hasAccess) {
      // Keep first 500 characters or so for the preview
      post.content = post.content.substring(0, 500) + "...";
    }

    // Fetch comments
    const commentsList = await db.query.comments
      .findMany({
        where: and(
          eq(comments.postId, post.id),
          eq(comments.status, "approved"),
        ),
        orderBy: [desc(comments.createdAt)],
      })
      .catch(() => []);

    // Fetch recommended posts (same category, different slug)
    const recommended = await db.query.posts.findMany({
      where: and(ne(posts.slug, slug), eq(posts.status, "published")),
      limit: 3,
    });

    // Fetch Stripe Price ID from settings
    const stripePriceId = await db.query.appSettings
      .findFirst({
        where: eq(appSettings.key, "stripePriceId"),
      })
      .then(
        (
          s: { key: string; value: string; updatedAt: Date | null } | undefined,
        ) => s?.value,
      );
    const site = await getSeoSiteData();

    return {
      post: post as PostWithExtras,
      comments: commentsList,
      recommended: (recommended as PostSummary[]) || [],
      hasAccess,
      stripePriceId,
      site,
    } as PostBySlugData;
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
        site.robotsIndexingEnabled && (!post.isPremium || data.hasAccess),
    });
  },
  component: PostDetail,
});

function PostDetail() {
  const { post, comments, recommended, hasAccess, stripePriceId } =
    Route.useLoaderData() as PostBySlugData;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const [subscribing, setSubscribing] = useState(false);
  const posthog = usePostHog();

  async function handleSubscribe() {
    if (!stripePriceId) {
      toast.error("Stripe checkout has not been configured by the administrator yet.");
      return;
    }

    posthog.capture("subscription_checkout_started", {
      post_slug: post.slug,
      post_title: post.title,
      price_id: stripePriceId,
    });

    try {
      setSubscribing(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: stripePriceId }),
        headers: {
          "Content-Type": "application/json",
          "X-PostHog-Session-Id": posthog.get_session_id() ?? "",
          "X-PostHog-Distinct-Id": posthog.get_distinct_id() ?? "",
        },
      });

      if (response.status === 401) {
        // Redirect to login if not authenticated
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const data = (await response.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      posthog.captureException(error);
      console.error("Checkout error:", error);
      toast.error("Something went wrong while starting checkout. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        {/* Post Hero */}
        <BlogHero post={post} />

        {/* Social Sharing */}
        <div className="bg-card border shadow-sm rounded-md p-4 sm:p-6">
          <SocialSharing url={currentUrl} title={post.title} />
        </div>

        {/* Table of Contents */}
        <TableOfContents content={post.content} />

        {/* Main Article Content */}
        <article className="bg-card border shadow-sm prose-lg p-6 sm:p-12 rounded-md relative overflow-hidden">
          <MarkdownContent content={post.content} />
          {!hasAccess && (
            <Paywall onSubscribe={handleSubscribe} isLoading={subscribing} />
          )}
        </article>

        {/* Author Bio */}
        <AuthorBio />

        {/* Comments Section */}
        <section className="bg-card border shadow-sm rounded-md p-6 sm:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-6  tracking-tight">
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

          <h3 className="text-2xl font-bold text-foreground mb-6  tracking-tight">
            Discussion ({comments?.length || 0})
          </h3>
          <CommentList comments={comments} />
        </section>

        {/* Newsletter */}
        <Newsletter />

        {/* Recommended Posts */}
        <RecommendedPosts posts={recommended} />
      </div>
    </main>
  );
}
