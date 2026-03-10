import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { db } from "#/db/index";
import { posts, comments, appSettings } from "#/db/schema";
import { eq, ne, desc, and } from "drizzle-orm";
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

const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const request = getRequest();

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });

    if (!post) {
      throw notFound();
    }

    const session = request
      ? await auth.api.getSession({
          headers: request.headers,
        })
      : null;

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
            (u: any) =>
              u?.stripeCurrentPeriodEnd &&
              u.stripeCurrentPeriodEnd > new Date(),
          )
      : false;

    const hasAccess =
      !post.isPremium || isSubscribed || session?.user?.role === "admin";

    // Truncate content if no access
    if (post.isPremium && !hasAccess) {
      // Keep first 500 characters or so for the preview
      post.content = post.content.substring(0, 500) + "...";
    }

    // Fetch blog settings for SEO
    const settings = await db.select().from(appSettings);
    const settingsObj: Record<string, string> = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });
    const blogName = settingsObj["blogName"] || "Lumina";

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

    return {
      post,
      comments: commentsList,
      recommended: (recommended as any[]) || [],
      hasAccess,
      stripePriceId,
      blogName,
    };
  });

const addComment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      postId: number;
      authorName: string;
      authorEmail?: string;
      content: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await db.insert(comments).values({
      postId: data.postId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || null,
      content: data.content,
      status: "pending",
    });

    return { success: true };
  });

export const Route = createFileRoute("/_public/blog/$slug")({
  loader: ({ params }) => getPostBySlug({ data: params.slug }),
  head: ({ loaderData }) => {
    const data = loaderData as any;
    const post = data?.post;
    const blogName = data?.blogName || "Lumina";

    if (!post) {
      return {
        meta: [{ title: `Post Not Found | ${blogName}` }],
      };
    }

    const title = `${post.metaTitle || post.title} | ${blogName}`;
    const description = post.metaDescription || post.excerpt;
    const image = post.ogImage || post.coverImage || undefined;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
    };
  },
  component: PostDetail,
});

function PostDetail() {
  const { post, comments, recommended, hasAccess, stripePriceId }: any =
    Route.useLoaderData();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const [subscribing, setSubscribing] = useState(false);
  const posthog = usePostHog();

  async function handleSubscribe() {
    if (!stripePriceId) {
      alert(
        "O checkout do Stripe ainda não foi configurado pelo administrador.",
      );
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

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      posthog.captureException(error);
      console.error("Checkout error:", error);
      alert("Ocorreu um erro ao iniciar o checkout. Tente novamente.");
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
