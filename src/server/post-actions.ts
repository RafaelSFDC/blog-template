import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, lte, ne } from "drizzle-orm";
import { notFound } from "@tanstack/react-router";
import { db } from "#/db/index";
import { postCategories, postRevisions, posts, postTags, user } from "#/db/schema";
import {
  ensurePostTransitionAllowed,
  requirePostAccess,
  requirePostCreateAccess,
  requireRoleAccess,
} from "#/lib/editorial-access";
import {
  getFriendlyDbError,
  normalizeSlug,
  postServerSchema,
  recordIdSchema,
} from "#/lib/cms-schema";
import { triggerWebhook } from "#/lib/webhooks";
import {
  getSlugConflictMessage,
  hasConflictingSlug,
  resolvePostPublishedAt,
  shouldTriggerPublishedWebhook,
} from "#/server/post-domain";
import { captureServerException } from "#/server/sentry";
import { logActivity } from "#/server/activity-log";
import {
  acquireContentLock,
  createPostRevision,
  getContentLock,
  heartbeatContentLock,
  listPostRevisions,
  releaseContentLock,
  restorePostRevisionToDraft,
} from "#/server/editorial-workflows";

async function assertPostSlugAvailable(slug: string, currentPostId?: number) {
  const existing = await db.query.posts.findFirst({
    where:
      currentPostId === undefined
        ? eq(posts.slug, slug)
        : and(eq(posts.slug, slug), ne(posts.id, currentPostId)),
    columns: {
      id: true,
    },
  });

  if (hasConflictingSlug(existing?.id, currentPostId)) {
    throw new Error(getSlugConflictMessage("Post"));
  }
}

export const getPostForEdit = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requirePostAccess("read", data.id);

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.id),
      with: {
        postCategories: true,
        postTags: true,
      },
    });

    if (!post) {
      throw notFound();
    }

    const revisions = await listPostRevisions(post.id);
    const lock = await getContentLock({
      entityType: "post",
      entityId: post.id,
    });

    return {
      ...post,
      revisions,
      lock,
    };
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postServerSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requirePostCreateAccess();
    const slug = normalizeSlug(data.slug, data.title);

    if (!slug) {
      throw new Error("Post slug could not be generated");
    }

    await ensurePostTransitionAllowed(session.user.role, data.status);
    const publishedAt = resolvePostPublishedAt(data.status, data.publishedAt);

    try {
      const created = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(posts)
          .values({
            title: data.title,
            slug,
            excerpt: data.excerpt,
            content: data.content,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            ogImage: data.ogImage,
            authorId: session.user.id,
            isPremium: data.isPremium,
            status: data.status,
            publishedAt,
            updatedAt: new Date(),
          })
          .returning({ id: posts.id });

        if (data.categoryIds.length > 0) {
          await tx
            .insert(postCategories)
            .values(data.categoryIds.map((categoryId) => ({ postId: inserted.id, categoryId })));
        }

        if (data.tagIds.length > 0) {
          await tx
            .insert(postTags)
            .values(data.tagIds.map((tagId) => ({ postId: inserted.id, tagId })));
        }

        return inserted;
      });

      await createPostRevision({
        postId: created.id,
        createdBy: session.user.id,
        source: data.status === "published" ? "publish" : "manual",
      });

      await logActivity({
        actorUserId: session.user.id,
        entityType: "post",
        entityId: created.id,
        action: "create",
        summary: `Post "${data.title}" created`,
        metadata: {
          slug,
          status: data.status,
        },
      });

      if (shouldTriggerPublishedWebhook(undefined, data.status)) {
        try {
          await triggerWebhook("post.published", {
            id: created.id,
            title: data.title,
            slug,
            excerpt: data.excerpt,
          });
        } catch (error) {
          captureServerException(error, {
            tags: {
              area: "server",
              flow: "post-published-webhook",
              operation: "create",
            },
            extras: {
              postId: created.id,
              slug,
            },
          });
          console.error("Post created, but webhook delivery failed:", error);
        }
      }

      return created;
    } catch (error) {
      throw new Error(
        getFriendlyDbError(error, "Post") ||
          (error instanceof Error ? error.message : "Could not create post"),
      );
    }
  });

export const updatePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    postServerSchema.safeExtend({ id: postServerSchema.shape.id.unwrap() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { session, post: existingPost } = await requirePostAccess("update", data.id);

    const slug = normalizeSlug(data.slug, data.title);
    if (!slug) {
      throw new Error("Post slug could not be generated");
    }

    await ensurePostTransitionAllowed(session.user.role, data.status);
    const publishedAt = resolvePostPublishedAt(
      data.status,
      data.publishedAt,
      existingPost.publishedAt,
    );

    try {
      await assertPostSlugAvailable(slug, data.id);

      await db.transaction(async (tx) => {
        await tx
          .update(posts)
          .set({
            title: data.title,
            slug,
            excerpt: data.excerpt,
            content: data.content,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            ogImage: data.ogImage,
            isPremium: data.isPremium,
            status: data.status,
            publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, data.id));

        await tx.delete(postCategories).where(eq(postCategories.postId, data.id));
        if (data.categoryIds.length > 0) {
          await tx
            .insert(postCategories)
            .values(data.categoryIds.map((categoryId) => ({ postId: data.id, categoryId })));
        }

        await tx.delete(postTags).where(eq(postTags.postId, data.id));
        if (data.tagIds.length > 0) {
          await tx
            .insert(postTags)
            .values(data.tagIds.map((tagId) => ({ postId: data.id, tagId })));
        }
      });

      const revisionSource = shouldTriggerPublishedWebhook(existingPost.status as never, data.status)
        ? "publish"
        : "manual";
      await createPostRevision({
        postId: data.id,
        createdBy: session.user.id,
        source: revisionSource,
      });

      await logActivity({
        actorUserId: session.user.id,
        entityType: "post",
        entityId: data.id,
        action:
          existingPost.status !== "published" && data.status === "published"
            ? "publish"
            : existingPost.status === "published" && data.status !== "published"
              ? "unpublish"
              : "update",
        summary: `Post "${data.title}" updated`,
        metadata: {
          slug,
          status: data.status,
        },
      });

      if (shouldTriggerPublishedWebhook(existingPost.status as never, data.status)) {
        try {
          await triggerWebhook("post.published", {
            id: data.id,
            title: data.title,
            slug,
            excerpt: data.excerpt,
          });
        } catch (error) {
          captureServerException(error, {
            tags: {
              area: "server",
              flow: "post-published-webhook",
              operation: "update",
            },
            extras: {
              postId: data.id,
              slug,
            },
          });
          console.error("Post updated, but webhook delivery failed:", error);
        }
      }

      return { ok: true as const };
    } catch (error) {
      throw new Error(
        getFriendlyDbError(error, "Post") ||
          (error instanceof Error ? error.message : "Could not update post"),
      );
    }
  });

export const autosavePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    postServerSchema.safeExtend({ id: postServerSchema.shape.id.unwrap() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("update", data.id);
    const slug = normalizeSlug(data.slug, data.title);

    if (!slug) {
      throw new Error("Post slug could not be generated");
    }

    await ensurePostTransitionAllowed(
      session.user.role,
      data.status === "published" || data.status === "scheduled" ? "draft" : data.status,
    );

    await assertPostSlugAvailable(slug, data.id);

    const revision = await createPostRevision({
      postId: data.id,
      createdBy: session.user.id,
      source: "autosave",
      snapshot: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        ogImage: data.ogImage ?? null,
        isPremium: data.isPremium,
        status: data.status,
        publishedAt: data.publishedAt ?? null,
        categoryIds: data.categoryIds,
        tagIds: data.tagIds,
      },
    });

    return {
      ok: true as const,
      revisionId: revision.id,
      savedAt: revision.createdAt,
    };
  });

export const restorePostRevision = createServerFn({ method: "POST" })
  .inputValidator((input: { revisionId: number }) => input)
  .handler(async ({ data }) => {
    const revision = await db.query.postRevisions.findFirst({
      where: eq(postRevisions.id, data.revisionId),
    });

    if (!revision) {
      throw new Error("Revision not found");
    }

    const { session } = await requirePostAccess("restore", revision.postId);
    await restorePostRevisionToDraft(data.revisionId);
    await createPostRevision({
      postId: revision.postId,
      createdBy: session.user.id,
      source: "restore",
    });
    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: revision.postId,
      action: "revision.restore",
      summary: `Revision ${data.revisionId} restored to draft`,
      metadata: {
        revisionId: data.revisionId,
      },
    });

    return { ok: true as const, postId: revision.postId };
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { session, post } = await requirePostAccess("delete", data.id);

    await db.delete(posts).where(eq(posts.id, data.id));
    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: data.id,
      action: "delete",
      summary: `Post "${post.title}" deleted`,
      metadata: {
        slug: post.slug,
      },
    });

    return { ok: true as const };
  });

export const getPostRevisionsForEditor = createServerFn({ method: "GET" })
  .inputValidator((input: { postId: number }) => input)
  .handler(async ({ data }) => {
    await requirePostAccess("read", data.postId);
    return listPostRevisions(data.postId);
  });

export const acquirePostLock = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: number }) => input)
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("update", data.postId);
    return acquireContentLock({
      entityType: "post",
      entityId: data.postId,
      userId: session.user.id,
    });
  });

export const heartbeatPostLock = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: number }) => input)
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("update", data.postId);
    return heartbeatContentLock({
      entityType: "post",
      entityId: data.postId,
      userId: session.user.id,
    });
  });

export const releasePostLock = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: number }) => input)
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("update", data.postId);
    await releaseContentLock({
      entityType: "post",
      entityId: data.postId,
      userId: session.user.id,
    });
    return { ok: true as const };
  });

export const getPostPreviewData = createServerFn({ method: "GET" })
  .inputValidator((input: { postId: number }) => input)
  .handler(async ({ data }) => {
    await requirePostAccess("read", data.postId);

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.postId),
      with: {
        author: true,
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const latestRevision = await db.query.postRevisions.findFirst({
      where: eq(postRevisions.postId, data.postId),
      orderBy: [desc(postRevisions.createdAt)],
    });

    const categoryIds = latestRevision
      ? JSON.parse(latestRevision.categoryIdsSnapshot)
      : (
          await db
            .select({ categoryId: postCategories.categoryId })
            .from(postCategories)
            .where(eq(postCategories.postId, data.postId))
        ).map((row) => row.categoryId);
    const tagIds = latestRevision
      ? JSON.parse(latestRevision.tagIdsSnapshot)
      : (
          await db
            .select({ tagId: postTags.tagId })
            .from(postTags)
            .where(eq(postTags.postId, data.postId))
        ).map((row) => row.tagId);

    const categoryRecords = categoryIds.length
      ? await db.query.categories.findMany({
          where: (categories, { inArray }) => inArray(categories.id, categoryIds),
        })
      : [];
    const tagRecords = tagIds.length
      ? await db.query.tags.findMany({
          where: (tags, { inArray }) => inArray(tags.id, tagIds),
        })
      : [];

    return {
      id: post.id,
      title: latestRevision?.title ?? post.title,
      slug: latestRevision?.slug ?? post.slug,
      excerpt: latestRevision?.excerpt ?? post.excerpt,
      content: latestRevision?.content ?? post.content,
      metaTitle: latestRevision?.metaTitle ?? post.metaTitle ?? "",
      metaDescription: latestRevision?.metaDescription ?? post.metaDescription ?? "",
      ogImage: latestRevision?.ogImage ?? post.ogImage ?? "",
      isPremium: Boolean(latestRevision?.isPremium ?? post.isPremium),
      status: latestRevision?.status ?? post.status,
      publishedAt: latestRevision?.publishedAt
        ? new Date(latestRevision.publishedAt).toISOString()
        : post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : "",
      categoryIds,
      tagIds,
      categories: categoryRecords.map((category) => ({
        id: category.id,
        name: category.name,
      })),
      tags: tagRecords.map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
      authorName: post.author?.name ?? "Editorial Team",
      coverImage: post.coverImage ?? null,
    };
  });

export async function publishScheduledPosts(now = new Date()) {
  const duePosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(and(eq(posts.status, "scheduled"), lte(posts.publishedAt, now)));

  if (duePosts.length === 0) {
    return { count: 0, publishedIds: [] as number[] };
  }

  const publishedIds: number[] = [];

  for (const post of duePosts) {
    await db
      .update(posts)
      .set({
        status: "published",
        updatedAt: now,
      })
      .where(eq(posts.id, post.id));

    await createPostRevision({
      postId: post.id,
      createdBy: post.authorId,
      source: "publish",
    });

    await logActivity({
      actorUserId: post.authorId,
      entityType: "post",
      entityId: post.id,
      action: "publish",
      summary: `Scheduled post "${post.title}" published`,
      metadata: {
        slug: post.slug,
      },
    });

    await triggerWebhook("post.published", {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
    });

    publishedIds.push(post.id);
  }

  return { count: publishedIds.length, publishedIds };
}

export const getDashboardPosts = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);

  let query = db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      authorId: posts.authorId,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      authorName: user.name,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id));

  if (session.user.role === "author") {
    query = query.where(eq(posts.authorId, session.user.id));
  }

  return query.orderBy(desc(posts.updatedAt), desc(posts.publishedAt));
});
