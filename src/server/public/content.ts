import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "@tanstack/react-router";
import { db } from "#/db/index";
import { comments, posts } from "#/db/schema";
import { auth } from "#/lib/auth";
import { resolveTeaserContent } from "#/lib/membership";
import { resolvePublicCacheControl } from "#/lib/seo";
import { publicCommentSchema } from "#/schemas/editorial";
import { createPendingComment } from "#/server/comment-actions";
import { getPricingPlansData, getUserEntitlement } from "#/server/membership-actions";
import { getPublishedPageBySlug } from "#/server/page-actions";
import { getRelatedPostsByTaxonomy } from "#/server/public-discovery";
import { getRedirectByPath } from "#/server/redirect-actions";
import { getSeoSiteData } from "#/server/seo-actions";

export const getPublicPageBySlug = createServerFn({ method: "GET" })
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
    const defaultPlan =
      plans.find((plan) => plan.isDefault && plan.isActive) ??
      plans.find((plan) => plan.slug === "annual" && plan.isActive) ??
      plans.find((plan) => plan.slug === "monthly" && plan.isActive);

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
      entitlementStatus: entitlement.status,
      defaultPlanSlug: defaultPlan?.slug === "monthly" ? "monthly" : "annual",
      site,
    };
  });

export const addPublicComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicCommentSchema.parse(input))
  .handler(async ({ data }) => {
    await createPendingComment(data);
    return { success: true };
  });
