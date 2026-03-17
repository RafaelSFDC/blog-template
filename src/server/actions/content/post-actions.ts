import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, inArray, lte, ne } from "drizzle-orm";
import { notFound } from "@tanstack/react-router";
import { db } from "#/db/index";
import {
  categories,
  editorialChecklists,
  editorialComments,
  postCategories,
  postRevisions,
  posts,
  postTags,
  tags,
} from "#/db/schema";
import {
  canManagePostWorkflow,
  canResolveEditorialComments,
  ensurePostTransitionAllowed,
  requirePostAccess,
  requirePostCreateAccess,
  requireRoleAccess,
} from "#/server/editorial/access";
import {
  bulkPostActionSchema,
  dashboardPostsFilterSchema,
  editorialChecklistUpdateSchema,
  editorialCommentCreateSchema,
  editorialCommentResolveSchema,
  postServerSchema,
  postWorkflowActionInputSchema,
} from "#/schemas/editorial";
import { getFriendlyDbError, normalizeSlug, recordIdSchema } from "#/schemas/system";
import { triggerWebhook } from "#/server/integrations/webhooks";
import {
  getSlugConflictMessage,
  hasConflictingSlug,
  resolvePostPublishedAt,
  resolvePostScheduledAt,
  shouldTriggerPublishedWebhook,
} from "#/server/post-domain";
import { captureServerException } from "#/server/sentry";
import { logActivity } from "#/server/activity-log";
import { captureServerEvent } from "#/server/analytics";
import {
  acquireContentLock,
  createPostRevision,
  getContentLock,
  heartbeatContentLock,
  listAssignableEditors,
  listEditorialChecklist,
  listEditorialComments,
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

function getPostWorkflowPermissions(role: string | null | undefined, post: {
  authorId: string | null;
  status: string;
}, userId: string) {
  const isOwner = post.authorId === userId;
  const canManageWorkflow = canManagePostWorkflow(role);
  const canEditContent = canManageWorkflow || (isOwner && post.status === "draft");

  return {
    canEditContent,
    canManageWorkflow,
    canRequestReview: isOwner && post.status === "draft",
    canResolveComments: canResolveEditorialComments(role),
    canDelete: canManageWorkflow || (isOwner && post.status === "draft"),
  };
}

function normalizeSearchText(value: string | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

async function getPostWorkflowBundle(postId: number) {
  const checklist = await listEditorialChecklist(postId);
  const comments = await listEditorialComments(postId);
  const editors = await listAssignableEditors();
  return {
    checklist,
    comments,
    editors,
  };
}

async function captureFirstPostPublishedIfNeeded(input: {
  actorDistinctId: string;
  actorUserId: string | null;
  postId: number;
  postSlug: string;
  postTitle: string;
}) {
  const [{ value: publishedCount }] = await db
    .select({ value: count() })
    .from(posts)
    .where(eq(posts.status, "published"));

  if (publishedCount !== 1) {
    return;
  }

  await captureServerEvent({
    distinctId: input.actorDistinctId,
    event: "first_post_published",
    properties: {
      actor_user_id: input.actorUserId,
      post_id: input.postId,
      post_slug: input.postSlug,
      post_title: input.postTitle,
      surface: "dashboard",
    },
  });
}

export const getPostForEdit = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("read", data.id);

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.id),
      with: {
        postCategories: true,
        postTags: true,
        editorOwner: {
          columns: {
            id: true,
            name: true,
          },
        },
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
    const workflow = await getPostWorkflowBundle(post.id);
    const permissions = getPostWorkflowPermissions(session.user.role, post, session.user.id);

    return {
      ...post,
      revisions,
      lock,
      workflow,
      permissions,
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
    const scheduledAt = resolvePostScheduledAt(data.status, data.publishedAt);
    const now = new Date();

    try {
      const [created] = await db
        .insert(posts)
        .values({
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage,
          seoNoIndex: data.seoNoIndex,
          authorId: session.user.id,
          editorOwnerId: data.editorOwnerId || null,
          isPremium: data.isPremium,
          commentsEnabled: data.commentsEnabled,
          teaserMode: data.teaserMode,
          status: data.status,
          reviewRequestedAt: data.status === "in_review" ? now : null,
          reviewRequestedBy: data.status === "in_review" ? session.user.id : null,
          approvedAt: data.status === "published" || data.status === "scheduled" ? now : null,
          approvedBy:
            data.status === "published" || data.status === "scheduled" ? session.user.id : null,
          lastReviewedAt:
            data.status === "published" || data.status === "scheduled" ? now : null,
          lastReviewedBy:
            data.status === "published" || data.status === "scheduled" ? session.user.id : null,
          scheduledAt,
          archivedAt: data.status === "archived" ? now : null,
          publishedAt,
          updatedAt: now,
        })
        .returning({ id: posts.id });

      if (data.categoryIds.length > 0) {
        await db
          .insert(postCategories)
          .values(data.categoryIds.map((categoryId) => ({ postId: created.id, categoryId })));
      }

      if (data.tagIds.length > 0) {
        await db
          .insert(postTags)
          .values(data.tagIds.map((tagId) => ({ postId: created.id, tagId })));
      }

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
          editorOwnerId: data.editorOwnerId ?? null,
          teaserMode: data.teaserMode,
        },
      });

      if (shouldTriggerPublishedWebhook(undefined, data.status)) {
        await captureFirstPostPublishedIfNeeded({
          actorDistinctId: session.user.email,
          actorUserId: session.user.id,
          postId: created.id,
          postSlug: slug,
          postTitle: data.title,
        });

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
    const scheduledAt = resolvePostScheduledAt(data.status, data.publishedAt);
    const now = new Date();

    try {
      await assertPostSlugAvailable(slug, data.id);

      await db
        .update(posts)
        .set({
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage,
          seoNoIndex: data.seoNoIndex,
          isPremium: data.isPremium,
          commentsEnabled: data.commentsEnabled,
          teaserMode: data.teaserMode,
          status: data.status,
          editorOwnerId: data.editorOwnerId || null,
          reviewRequestedAt:
            data.status === "in_review" ? existingPost.reviewRequestedAt ?? now : null,
          reviewRequestedBy:
            data.status === "in_review" ? existingPost.reviewRequestedBy ?? session.user.id : null,
          lastReviewedAt:
            data.status === "published" || data.status === "scheduled" ? now : existingPost.lastReviewedAt,
          lastReviewedBy:
            data.status === "published" || data.status === "scheduled" ? session.user.id : existingPost.lastReviewedBy,
          approvedAt:
            data.status === "published" || data.status === "scheduled"
              ? existingPost.approvedAt ?? now
              : null,
          approvedBy:
            data.status === "published" || data.status === "scheduled"
              ? existingPost.approvedBy ?? session.user.id
              : null,
          scheduledAt,
          archivedAt: data.status === "archived" ? now : null,
          publishedAt,
          updatedAt: now,
        })
        .where(eq(posts.id, data.id));

      await db.delete(postCategories).where(eq(postCategories.postId, data.id));
      if (data.categoryIds.length > 0) {
        await db
          .insert(postCategories)
          .values(data.categoryIds.map((categoryId) => ({ postId: data.id, categoryId })));
      }

      await db.delete(postTags).where(eq(postTags.postId, data.id));
      if (data.tagIds.length > 0) {
        await db
          .insert(postTags)
          .values(data.tagIds.map((tagId) => ({ postId: data.id, tagId })));
      }

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
          editorOwnerId: data.editorOwnerId ?? null,
          teaserMode: data.teaserMode,
        },
      });

      if (shouldTriggerPublishedWebhook(existingPost.status as never, data.status)) {
        await captureFirstPostPublishedIfNeeded({
          actorDistinctId: session.user.email,
          actorUserId: session.user.id,
          postId: data.id,
          postSlug: slug,
          postTitle: data.title,
        });

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
        seoNoIndex: data.seoNoIndex,
        isPremium: data.isPremium,
        commentsEnabled: data.commentsEnabled,
        teaserMode: data.teaserMode,
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

export const getPostWorkflowState = createServerFn({ method: "GET" })
  .inputValidator((input: { postId: number }) => input)
  .handler(async ({ data }) => {
    const { session, post } = await requirePostAccess("read", data.postId);
    const workflow = await getPostWorkflowBundle(data.postId);
    return {
      status: post.status,
      editorOwnerId: post.editorOwnerId ?? null,
      reviewRequestedAt: post.reviewRequestedAt ?? null,
      approvedAt: post.approvedAt ?? null,
      scheduledAt: post.scheduledAt ?? null,
      archivedAt: post.archivedAt ?? null,
      permissions: getPostWorkflowPermissions(session.user.role, post, session.user.id),
      ...workflow,
    };
  });

export const requestPostReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    postWorkflowActionInputSchema.pick({ id: true, editorOwnerId: true }).parse(input),
  )
  .handler(async ({ data }) => {
    const { session, post } = await requirePostAccess("update", data.id);
    if (post.status !== "draft") {
      throw new Error("Only draft posts can be sent for review");
    }

    const now = new Date();
    await db
      .update(posts)
      .set({
        status: "in_review",
        editorOwnerId: data.editorOwnerId || post.editorOwnerId || null,
        reviewRequestedAt: now,
        reviewRequestedBy: session.user.id,
        updatedAt: now,
      })
      .where(eq(posts.id, data.id));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: data.id,
      action: "review.requested",
      summary: `Review requested for "${post.title}"`,
      metadata: {
        editorOwnerId: data.editorOwnerId ?? post.editorOwnerId ?? null,
      },
    });

    return { ok: true as const };
  });

async function transitionPostWorkflow(input: {
  postId: number;
  actorUserId: string;
  action: "approve" | "send_back" | "publish" | "schedule" | "archive";
  scheduledFor?: Date;
  editorOwnerId?: string | null;
}) {
  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, input.postId),
  });

  if (!existing) {
    throw new Error("Post not found");
  }

  const now = new Date();
  let nextStatus = existing.status;
  let summary = `Post "${existing.title}" updated`;

  switch (input.action) {
    case "approve":
      if (existing.status !== "in_review") {
        throw new Error("Only posts in review can be approved");
      }
      nextStatus = "draft";
      summary = `Post "${existing.title}" approved`;
      break;
    case "send_back":
      nextStatus = "draft";
      summary = `Post "${existing.title}" sent back to draft`;
      break;
    case "publish":
      nextStatus = "published";
      summary = `Post "${existing.title}" published`;
      break;
    case "schedule":
      if (!input.scheduledFor) {
        throw new Error("Scheduled posts require a publication date");
      }
      nextStatus = "scheduled";
      summary = `Post "${existing.title}" scheduled`;
      break;
    case "archive":
      nextStatus = "archived";
      summary = `Post "${existing.title}" archived`;
      break;
  }

  const publishedAt = resolvePostPublishedAt(nextStatus as never, input.scheduledFor, existing.publishedAt);
  const scheduledAt = resolvePostScheduledAt(nextStatus as never, input.scheduledFor);

  await db
    .update(posts)
    .set({
      status: nextStatus,
      editorOwnerId: input.editorOwnerId ?? existing.editorOwnerId ?? null,
      lastReviewedAt: now,
      lastReviewedBy: input.actorUserId,
      approvedAt:
        input.action === "approve" || input.action === "publish" || input.action === "schedule"
          ? now
          : existing.approvedAt,
      approvedBy:
        input.action === "approve" || input.action === "publish" || input.action === "schedule"
          ? input.actorUserId
          : existing.approvedBy,
      reviewRequestedAt: nextStatus === "in_review" ? existing.reviewRequestedAt : null,
      reviewRequestedBy: nextStatus === "in_review" ? existing.reviewRequestedBy : null,
      publishedAt,
      scheduledAt,
      archivedAt: nextStatus === "archived" ? now : null,
      updatedAt: now,
    })
    .where(eq(posts.id, input.postId));

  await createPostRevision({
    postId: input.postId,
    createdBy: input.actorUserId,
    source: nextStatus === "published" ? "publish" : "manual",
  });

  await logActivity({
    actorUserId: input.actorUserId,
    entityType: "post",
    entityId: input.postId,
    action:
      input.action === "send_back"
        ? "review.sent_back"
        : input.action === "approve"
          ? "review.approved"
          : input.action === "schedule"
            ? "post.scheduled"
            : input.action === "archive"
              ? "post.archived"
              : "publish",
    summary,
    metadata: {
      nextStatus,
      scheduledAt: scheduledAt ?? null,
    },
  });

  if (input.action === "publish" && shouldTriggerPublishedWebhook(existing.status as never, nextStatus as never)) {
    await captureFirstPostPublishedIfNeeded({
      actorDistinctId: input.actorUserId,
      actorUserId: input.actorUserId,
      postId: input.postId,
      postSlug: existing.slug,
      postTitle: existing.title,
    });

    await triggerWebhook("post.published", {
      id: input.postId,
      title: existing.title,
      slug: existing.slug,
      excerpt: existing.excerpt,
    });
  }

  return { ok: true as const };
}

export const approvePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    postWorkflowActionInputSchema.pick({ id: true, action: true, scheduledFor: true, editorOwnerId: true }).parse(input),
  )
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("publish", data.id);
    if (data.action !== "approve" && data.action !== "publish" && data.action !== "schedule") {
      throw new Error("Unsupported workflow action");
    }

    return transitionPostWorkflow({
      postId: data.id,
      actorUserId: session.user.id,
      action: data.action,
      scheduledFor: data.scheduledFor ?? undefined,
      editorOwnerId: data.editorOwnerId ?? null,
    });
  });

export const sendPostBackToDraft = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("publish", data.id);
    return transitionPostWorkflow({
      postId: data.id,
      actorUserId: session.user.id,
      action: "send_back",
    });
  });

export const archivePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("publish", data.id);
    return transitionPostWorkflow({
      postId: data.id,
      actorUserId: session.user.id,
      action: "archive",
    });
  });

export const updateEditorialChecklist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => editorialChecklistUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { session, post } = await requirePostAccess("read", data.postId);
    const permissions = getPostWorkflowPermissions(session.user.role, post, session.user.id);
    if (!permissions.canEditContent && !permissions.canManageWorkflow) {
      throw new Error("You do not have permission to update the checklist");
    }

    const now = new Date();
    await listEditorialChecklist(data.postId);
    await db
      .update(editorialChecklists)
      .set({
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? now : null,
        completedBy: data.isCompleted ? session.user.id : null,
        updatedAt: now,
      })
      .where(and(eq(editorialChecklists.postId, data.postId), eq(editorialChecklists.itemKey, data.itemKey)));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: data.postId,
      action: "checklist.updated",
      summary: `Checklist item ${data.itemKey} ${data.isCompleted ? "completed" : "reopened"}`,
      metadata: {
        itemKey: data.itemKey,
        isCompleted: data.isCompleted,
      },
    });

    return listEditorialChecklist(data.postId);
  });

export const createEditorialComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => editorialCommentCreateSchema.parse(input))
  .handler(async ({ data }) => {
    const { session } = await requirePostAccess("read", data.postId);
    const [created] = await db
      .insert(editorialComments)
      .values({
        postId: data.postId,
        authorUserId: session.user.id,
        content: data.content,
        createdAt: new Date(),
      })
      .returning();

    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: data.postId,
      action: "editorial_comment.created",
      summary: "Internal editorial comment added",
      metadata: {
        commentId: created.id,
      },
    });

    return listEditorialComments(data.postId);
  });

export const resolveEditorialComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => editorialCommentResolveSchema.parse(input))
  .handler(async ({ data }) => {
    const comment = await db.query.editorialComments.findFirst({
      where: eq(editorialComments.id, data.commentId),
    });

    if (!comment) {
      throw new Error("Editorial comment not found");
    }

    const { session } = await requirePostAccess("read", comment.postId);
    if (!canResolveEditorialComments(session.user.role)) {
      throw new Error("Only editors can resolve internal comments");
    }

    await db
      .update(editorialComments)
      .set({
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      })
      .where(eq(editorialComments.id, data.commentId));

    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: comment.postId,
      action: "editorial_comment.resolved",
      summary: "Internal editorial comment resolved",
      metadata: {
        commentId: comment.id,
      },
    });

    return listEditorialComments(comment.postId);
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
    type CategoryRow = { categoryId: number };
    type TagRow = { tagId: number };

    const categoryIds = latestRevision
      ? JSON.parse(latestRevision.categoryIdsSnapshot)
      : (
          await db
            .select({ categoryId: postCategories.categoryId })
            .from(postCategories)
            .where(eq(postCategories.postId, data.postId))
        ).map((row: CategoryRow) => row.categoryId);
    const tagIds = latestRevision
      ? JSON.parse(latestRevision.tagIdsSnapshot)
      : (
          await db
            .select({ tagId: postTags.tagId })
            .from(postTags)
            .where(eq(postTags.postId, data.postId))
        ).map((row: TagRow) => row.tagId);

    const categoryRecords = categoryIds.length
      ? await db.query.categories.findMany({
          where: inArray(categories.id, categoryIds),
        })
      : [];
    const tagRecords = tagIds.length
      ? await db.query.tags.findMany({
          where: inArray(tags.id, tagIds),
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
      seoNoIndex: latestRevision?.seoNoIndex ?? post.seoNoIndex,
      isPremium: Boolean(latestRevision?.isPremium ?? post.isPremium),
      commentsEnabled: post.commentsEnabled,
      teaserMode: latestRevision?.teaserMode ?? post.teaserMode ?? "excerpt",
      status: latestRevision?.status ?? post.status,
      publishedAt: (latestRevision?.status ?? post.status) === "scheduled"
        ? post.scheduledAt
          ? new Date(post.scheduledAt).toISOString()
          : ""
        : latestRevision?.publishedAt
        ? new Date(latestRevision.publishedAt).toISOString()
        : post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : "",
      categoryIds,
      tagIds,
      categories: categoryRecords.map((category: (typeof categoryRecords)[number]) => ({
        id: category.id,
        name: category.name,
      })),
      tags: tagRecords.map((tag: (typeof tagRecords)[number]) => ({
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
    .where(and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, now)));

  if (duePosts.length === 0) {
    return { count: 0, publishedIds: [] as number[] };
  }

  const publishedIds: number[] = [];

  for (const post of duePosts as (typeof duePosts)) {
    await db
      .update(posts)
      .set({
        status: "published",
        publishedAt: now,
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

    await captureFirstPostPublishedIfNeeded({
      actorDistinctId: post.authorId ?? `post-${post.id}`,
      actorUserId: post.authorId,
      postId: post.id,
      postSlug: post.slug,
      postTitle: post.title,
    });

    publishedIds.push(post.id);
  }

  return { count: publishedIds.length, publishedIds };
}

export const bulkUpdatePosts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bulkPostActionSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);
    const selectedPosts = await db.query.posts.findMany({
      where: inArray(posts.id, data.ids),
      columns: {
        id: true,
        status: true,
        authorId: true,
        title: true,
      },
    });

    if (selectedPosts.length === 0) {
      throw new Error("No posts found for this bulk action");
    }

    for (const post of selectedPosts as (typeof selectedPosts)) {
      if (data.action === "delete") {
        await deletePost({ data: { id: post.id } });
        continue;
      }

      if (data.action === "request_review") {
        await requestPostReview({ data: { id: post.id, editorOwnerId: undefined } });
        continue;
      }

      if (data.action === "move_to_draft") {
        await sendPostBackToDraft({ data: { id: post.id } });
        continue;
      }

      if (data.action === "archive") {
        await archivePost({ data: { id: post.id } });
        continue;
      }

      if (data.action === "publish") {
        await approvePost({ data: { id: post.id, action: "publish", scheduledFor: undefined, editorOwnerId: undefined } });
        continue;
      }

      if (data.action === "schedule") {
        await approvePost({
          data: {
            id: post.id,
            action: "schedule",
            scheduledFor: data.scheduledFor,
            editorOwnerId: undefined,
          },
        });
      }
    }

    await logActivity({
      actorUserId: session.user.id,
      entityType: "post",
      entityId: data.ids.join(","),
      action: "bulk.update",
      summary: `Bulk action ${data.action} applied to ${selectedPosts.length} posts`,
      metadata: {
        ids: data.ids,
        action: data.action,
      },
    });

    return { ok: true as const, count: selectedPosts.length };
  });

export const getDashboardPosts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => dashboardPostsFilterSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const session = await requireRoleAccess(["author", "editor", "admin", "super-admin"]);
    const isAuthor = session.user.role === "author";
    const visibility = data.visibility ?? (isAuthor ? "mine" : "all");

    const rows = await db.query.posts.findMany({
      with: {
        author: {
          columns: {
            id: true,
            name: true,
          },
        },
        editorOwner: {
          columns: {
            id: true,
            name: true,
          },
        },
        postCategories: {
          columns: {
            categoryId: true,
          },
        },
        postTags: {
          columns: {
            tagId: true,
          },
        },
      },
      orderBy: [desc(posts.updatedAt), desc(posts.publishedAt)],
    });

    const search = normalizeSearchText(data.query);

    type DashboardPostRow = (typeof rows)[number];
    return rows.filter((post: DashboardPostRow) => {
      if (isAuthor && post.authorId !== session.user.id) {
        return false;
      }

      if (!isAuthor && visibility === "mine" && post.authorId !== session.user.id && post.editorOwnerId !== session.user.id) {
        return false;
      }

      if (!isAuthor && visibility === "team" && (post.authorId === session.user.id || post.editorOwnerId === session.user.id)) {
        return false;
      }

      if (data.status && post.status !== data.status) {
        return false;
      }

      if (data.authorId && post.authorId !== data.authorId) {
        return false;
      }

      if (data.editorOwnerId && post.editorOwnerId !== data.editorOwnerId) {
        return false;
      }

      if (data.taxonomyType === "category" && data.taxonomyId && !post.postCategories.some((item: DashboardPostRow["postCategories"][number]) => item.categoryId === data.taxonomyId)) {
        return false;
      }

      if (data.taxonomyType === "tag" && data.taxonomyId && !post.postTags.some((item: DashboardPostRow["postTags"][number]) => item.tagId === data.taxonomyId)) {
        return false;
      }

      if (data.from) {
        const compareDate = post.scheduledAt ?? post.publishedAt ?? post.updatedAt;
        if (!compareDate || compareDate < data.from) {
          return false;
        }
      }

      if (data.to) {
        const compareDate = post.scheduledAt ?? post.publishedAt ?? post.updatedAt;
        if (!compareDate || compareDate > data.to) {
          return false;
        }
      }

      if (search) {
        const haystack = [post.title, post.slug, post.author?.name ?? ""]
          .join(" ")
          .toLocaleLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    }).map((post: DashboardPostRow) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      authorId: post.authorId,
      editorOwnerId: post.editorOwnerId,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      updatedAt: post.updatedAt,
      archivedAt: post.archivedAt,
      reviewRequestedAt: post.reviewRequestedAt,
      authorName: post.author?.name ?? null,
      editorOwnerName: post.editorOwner?.name ?? null,
    }));
  });
