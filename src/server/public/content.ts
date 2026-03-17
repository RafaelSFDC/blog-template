import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "@tanstack/react-router";
import { db } from "#/db/index";
import { comments, posts } from "#/db/schema";
import { auth } from "#/server/auth/auth";
import { resolvePaywallVariant } from "#/lib/conversion";
import { resolveTeaserContent } from "#/lib/membership";
import { resolvePublicCacheControl } from "#/lib/seo";
import { publicCommentSubmissionSchema } from "#/schemas/editorial";
import { createPendingComment } from "#/server/comment-actions";
import { getPricingPlansData, getUserEntitlement } from "#/server/membership-actions";
import { getPublishedPageBySlug } from "#/server/page-actions";
import { getRelatedPostsByTaxonomy } from "#/server/public-discovery";
import { getRedirectByPath } from "#/server/redirect-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { enforceRateLimit } from "#/server/security/rate-limit";
import { getSecurityRequestMetadata } from "#/server/security/request";
import { verifyTurnstileToken } from "#/server/integrations/turnstile";
import { logSecurityEvent } from "#/server/security/events";

async function loadPublicPageBySlug(slug: string) {
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

  const page = await getPublishedPageBySlug(slug);
  if (!page) {
    return null;
  }

  const entitlement = await getUserEntitlement({
    userId: session?.user?.id,
    role: session?.user?.role,
    isPremium: Boolean(page.isPremium),
  });
  const plans = await getPricingPlansData();
  type PricingPlan = (typeof plans)[number];
  const defaultPlan =
    plans.find((plan: PricingPlan) => plan.isDefault && plan.isActive) ??
    plans.find((plan: PricingPlan) => plan.slug === "annual" && plan.isActive) ??
    plans.find((plan: PricingPlan) => plan.slug === "monthly" && plan.isActive);

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
}

export const getOptionalPublicPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }) => {
    return loadPublicPageBySlug(data);
  });

export const getPublicPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }) => {
    const payload = await loadPublicPageBySlug(data);
    if (payload) {
      return payload;
    }

    const redirectMatch = await getRedirectByPath(`/${data}`);
    if (redirectMatch) {
      throw redirect({
        href: redirectMatch.destinationPath,
        statusCode: redirectMatch.statusCode,
      });
    }
    throw notFound();
  });

export const getPublicPostBySlug = createServerFn({ method: "GET" })
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

    setResponseHeader(
      "Cache-Control",
      resolvePublicCacheControl({
        hasSession: Boolean(session),
        ttlSeconds: 3600,
        staleSeconds: 86400,
      }),
    );

    if (
      post.status !== "published" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super-admin"
    ) {
      throw notFound();
    }

    const entitlement = await getUserEntitlement({
      userId: session?.user?.id,
      role: session?.user?.role,
      isPremium: Boolean(post.isPremium),
    });
    const hasAccess = entitlement.access === "full";
    const plans = await getPricingPlansData();
    type PricingPlan = (typeof plans)[number];
    const defaultPlan =
      plans.find((plan: PricingPlan) => plan.isDefault && plan.isActive) ??
      plans.find((plan: PricingPlan) => plan.slug === "annual" && plan.isActive) ??
      plans.find((plan: PricingPlan) => plan.slug === "monthly" && plan.isActive);

    const commentsList = await db.query.comments
      .findMany({
        where: and(eq(comments.postId, post.id), eq(comments.status, "approved")),
        orderBy: [desc(comments.createdAt)],
      })
      .catch(() => []);

    const recommended = await getRelatedPostsByTaxonomy(post.id);
    const site = await getSeoSiteData();

    return {
      post: {
        ...post,
        authorName: post.author?.name ?? "Editorial Team",
        authorSlug: post.author?.publicAuthorSlug ?? null,
        authorBio: post.author?.authorBio ?? null,
        authorHeadline: post.author?.authorHeadline ?? null,
        category: post.postCategories[0]?.category?.name ?? null,
        categorySlug: post.postCategories[0]?.category?.slug ?? null,
        commentsEnabled: post.commentsEnabled,
        content: hasAccess
          ? post.content
          : resolveTeaserContent({
              content: post.content,
              excerpt: post.excerpt,
              teaserMode: post.teaserMode ?? "excerpt",
            }),
      },
      comments: commentsList,
      recommended,
      hasAccess,
      isAuthenticated: Boolean(session?.user),
      viewerEmail: session?.user?.email ?? null,
      entitlementStatus: entitlement.status,
      paywallVariant: resolvePaywallVariant({
        sitePresetKey: site.sitePresetKey,
        teaserMode: post.teaserMode,
        isPremium: Boolean(post.isPremium),
      }),
      defaultPlanSlug: defaultPlan?.slug === "monthly" ? "monthly" : "annual",
      site,
    };
  });

export const addPublicComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicCommentSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!request) {
      throw new Error("Request context unavailable");
    }

    const decision = await enforceRateLimit({
      scope: "comment.create",
      request,
      keyParts: [data.authorEmail?.toLowerCase() ?? null],
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!decision.allowed) {
      throw new Error("Too many comments. Please try again later.");
    }

    const metadata = getSecurityRequestMetadata(request);
    const verification = await verifyTurnstileToken({
      token: data.turnstileToken,
      ip: metadata.ip,
    });

    if (!verification.success) {
      await logSecurityEvent({
        type: "turnstile.failed",
        scope: "comment.create",
        ipHash: metadata.ipHash,
        userAgent: metadata.userAgentShort,
        metadata: {
          email: data.authorEmail?.toLowerCase() ?? null,
          errors: verification.errors ?? [],
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      throw new Error("Security verification failed. Please try again.");
    }

    await createPendingComment({
      ...data,
      sourceIpHash: metadata.ipHash,
      userAgent: metadata.userAgentShort,
    });
    return { success: true };
  });
