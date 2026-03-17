import { and, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { db } from "#/db/index";
import {
  contentLocks,
  editorialChecklists,
  editorialComments,
  pageRevisions,
  pages,
  postCategories,
  postRevisions,
  posts,
  postTags,
  user,
} from "#/db/schema";
import type { ContentLockState, RevisionSource } from "#/types/editorial";
import { EDITORIAL_CHECKLIST_ITEMS } from "#/lib/editorial-workflow";

export const LOCK_TTL_MS = 2 * 60 * 1000;

function toJsonArray(values: number[]) {
  return JSON.stringify(values);
}

function parseJsonArray(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => Number.isInteger(item)) : [];
  } catch {
    return [];
  }
}

export async function createPostRevision(input: {
  postId: number;
  createdBy?: string | null;
  source: RevisionSource;
  snapshot?: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogImage?: string | null;
    seoNoIndex: boolean;
    isPremium: boolean;
    commentsEnabled?: boolean;
    teaserMode: string;
    status: string;
    publishedAt?: Date | null;
    categoryIds: number[];
    tagIds: number[];
  };
}) {
  let snapshot = input.snapshot;

  if (!snapshot) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, input.postId),
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const categoryRows = await db
      .select({ categoryId: postCategories.categoryId })
      .from(postCategories)
      .where(eq(postCategories.postId, input.postId));
    const tagRows = await db
      .select({ tagId: postTags.tagId })
      .from(postTags)
      .where(eq(postTags.postId, input.postId));

    snapshot = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      ogImage: post.ogImage,
      seoNoIndex: Boolean(post.seoNoIndex),
      isPremium: Boolean(post.isPremium),
      teaserMode: post.teaserMode ?? "excerpt",
      status: post.status,
      publishedAt: post.publishedAt,
      categoryIds: categoryRows.map((row: (typeof categoryRows)[number]) => row.categoryId),
      tagIds: tagRows.map((row: (typeof tagRows)[number]) => row.tagId),
    };
  }

  const [revision] = await db
    .insert(postRevisions)
    .values({
      postId: input.postId,
      title: snapshot.title,
      slug: snapshot.slug,
      excerpt: snapshot.excerpt,
      content: snapshot.content,
      metaTitle: snapshot.metaTitle,
      metaDescription: snapshot.metaDescription,
      ogImage: snapshot.ogImage,
      seoNoIndex: snapshot.seoNoIndex,
      isPremium: snapshot.isPremium,
      teaserMode: snapshot.teaserMode,
      status: snapshot.status,
      publishedAt: snapshot.publishedAt,
      categoryIdsSnapshot: toJsonArray(snapshot.categoryIds),
      tagIdsSnapshot: toJsonArray(snapshot.tagIds),
      createdBy: input.createdBy ?? null,
      source: input.source,
      createdAt: new Date(),
    })
    .returning();

  return revision;
}

export async function createPageRevision(input: {
  pageId: number;
  createdBy?: string | null;
  source: RevisionSource;
  snapshot?: {
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogImage?: string | null;
    seoNoIndex: boolean;
    isPremium: boolean;
    teaserMode: string;
    status: string;
    isHome: boolean;
    publishedAt?: Date | null;
  };
}) {
  let snapshot = input.snapshot;

  if (!snapshot) {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, input.pageId),
    });

    if (!page) {
      throw new Error("Page not found");
    }

    snapshot = {
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      content: page.content,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImage: page.ogImage,
      seoNoIndex: Boolean(page.seoNoIndex),
      isPremium: Boolean(page.isPremium),
      teaserMode: page.teaserMode ?? "excerpt",
      status: page.status,
      isHome: Boolean(page.isHome),
      publishedAt: page.publishedAt,
    };
  }

  const [revision] = await db
    .insert(pageRevisions)
    .values({
      pageId: input.pageId,
      title: snapshot.title,
      slug: snapshot.slug,
      excerpt: snapshot.excerpt,
      content: snapshot.content,
      metaTitle: snapshot.metaTitle,
      metaDescription: snapshot.metaDescription,
      ogImage: snapshot.ogImage,
      seoNoIndex: snapshot.seoNoIndex,
      isPremium: snapshot.isPremium,
      teaserMode: snapshot.teaserMode,
      status: snapshot.status,
      isHome: snapshot.isHome,
      publishedAt: snapshot.publishedAt,
      createdBy: input.createdBy ?? null,
      source: input.source,
      createdAt: new Date(),
    })
    .returning();

  return revision;
}

export async function listPostRevisions(postId: number) {
  return db.query.postRevisions.findMany({
    where: eq(postRevisions.postId, postId),
    orderBy: [desc(postRevisions.createdAt)],
  });
}

export async function listPageRevisions(pageId: number) {
  return db.query.pageRevisions.findMany({
    where: eq(pageRevisions.pageId, pageId),
    orderBy: [desc(pageRevisions.createdAt)],
  });
}

export async function restorePostRevisionToDraft(revisionId: number) {
  const revision = await db.query.postRevisions.findFirst({
    where: eq(postRevisions.id, revisionId),
  });

  if (!revision) {
    throw new Error("Revision not found");
  }

  await db
    .update(posts)
    .set({
      title: revision.title,
      slug: revision.slug,
      excerpt: revision.excerpt,
      content: revision.content,
      metaTitle: revision.metaTitle,
      metaDescription: revision.metaDescription,
      ogImage: revision.ogImage,
      seoNoIndex: revision.seoNoIndex,
      isPremium: revision.isPremium,
      teaserMode: revision.teaserMode,
      status: "draft",
      reviewRequestedAt: null,
      reviewRequestedBy: null,
      lastReviewedAt: null,
      lastReviewedBy: null,
      approvedAt: null,
      approvedBy: null,
      scheduledAt: null,
      archivedAt: null,
      publishedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, revision.postId));

  await db.delete(postCategories).where(eq(postCategories.postId, revision.postId));
  const categoryIds = parseJsonArray(revision.categoryIdsSnapshot);
  if (categoryIds.length > 0) {
    await db.insert(postCategories).values(
      categoryIds.map((categoryId) => ({
        postId: revision.postId,
        categoryId,
      })),
    );
  }

  await db.delete(postTags).where(eq(postTags.postId, revision.postId));
  const tagIds = parseJsonArray(revision.tagIdsSnapshot);
  if (tagIds.length > 0) {
    await db.insert(postTags).values(
      tagIds.map((tagId) => ({
        postId: revision.postId,
        tagId,
      })),
    );
  }

  return revision;
}

export async function restorePageRevisionToDraft(revisionId: number) {
  const revision = await db.query.pageRevisions.findFirst({
    where: eq(pageRevisions.id, revisionId),
  });

  if (!revision) {
    throw new Error("Revision not found");
  }

  await db
    .update(pages)
    .set({
      title: revision.title,
      slug: revision.slug,
      excerpt: revision.excerpt,
      content: revision.content,
      metaTitle: revision.metaTitle,
      metaDescription: revision.metaDescription,
      ogImage: revision.ogImage,
      seoNoIndex: revision.seoNoIndex,
      isPremium: revision.isPremium,
      teaserMode: revision.teaserMode,
      status: "draft",
      isHome: revision.isHome,
      publishedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, revision.pageId));

  return revision;
}

export async function acquireContentLock(input: {
  entityType: "post" | "page";
  entityId: number;
  userId: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  const existing = await db.query.contentLocks.findFirst({
    where: and(
      eq(contentLocks.entityType, input.entityType),
      eq(contentLocks.entityId, String(input.entityId)),
    ),
  });

  if (!existing || !existing.expiresAt || existing.expiresAt <= now) {
    if (existing) {
      await db.delete(contentLocks).where(eq(contentLocks.id, existing.id));
    }

    const [created] = await db
      .insert(contentLocks)
      .values({
        entityType: input.entityType,
        entityId: String(input.entityId),
        userId: input.userId,
        acquiredAt: now,
        expiresAt,
        lastHeartbeatAt: now,
      })
      .returning();

    return {
      state: "acquired" as ContentLockState,
      lock: created,
    };
  }

  if (existing.userId === input.userId) {
    const [updated] = await db
      .update(contentLocks)
      .set({
        expiresAt,
        lastHeartbeatAt: now,
      })
      .where(eq(contentLocks.id, existing.id))
      .returning();

    return {
      state: "acquired" as ContentLockState,
      lock: updated,
    };
  }

  return {
    state: "held_by_other" as ContentLockState,
    lock: existing,
  };
}

export async function heartbeatContentLock(input: {
  entityType: "post" | "page";
  entityId: number;
  userId: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  const [updated] = await db
    .update(contentLocks)
    .set({
      lastHeartbeatAt: now,
      expiresAt,
    })
    .where(
      and(
        eq(contentLocks.entityType, input.entityType),
        eq(contentLocks.entityId, String(input.entityId)),
        eq(contentLocks.userId, input.userId),
      ),
    )
    .returning();

  if (!updated) {
    return acquireContentLock(input);
  }

  return {
    state: "acquired" as ContentLockState,
    lock: updated,
  };
}

export async function releaseContentLock(input: {
  entityType: "post" | "page";
  entityId: number;
  userId: string;
}) {
  await db.delete(contentLocks).where(
    and(
      eq(contentLocks.entityType, input.entityType),
      eq(contentLocks.entityId, String(input.entityId)),
      eq(contentLocks.userId, input.userId),
    ),
  );
}

export async function getContentLock(input: {
  entityType: "post" | "page";
  entityId: number;
}) {
  const now = new Date();
  const lock = await db.query.contentLocks.findFirst({
    where: and(
      eq(contentLocks.entityType, input.entityType),
      eq(contentLocks.entityId, String(input.entityId)),
      gt(contentLocks.expiresAt, now),
    ),
  });

  return lock ?? null;
}

export async function cleanupExpiredContentLocks() {
  await db.delete(contentLocks).where(lt(contentLocks.expiresAt, new Date()));
}

export async function ensurePostChecklist(postId: number) {
  const existing = await db.query.editorialChecklists.findMany({
    where: eq(editorialChecklists.postId, postId),
  });

  const existingKeys = new Set(existing.map((item: (typeof existing)[number]) => item.itemKey));
  const missingItems = EDITORIAL_CHECKLIST_ITEMS.filter((item) => !existingKeys.has(item.key));

  if (missingItems.length > 0) {
    await db.insert(editorialChecklists).values(
      missingItems.map((item) => ({
        postId,
        itemKey: item.key,
        isCompleted: false,
        updatedAt: new Date(),
      })),
    );
  }
}

export async function listEditorialChecklist(postId: number) {
  await ensurePostChecklist(postId);
  const rows = await db.query.editorialChecklists.findMany({
    where: eq(editorialChecklists.postId, postId),
    orderBy: [desc(editorialChecklists.updatedAt)],
    with: {
      completedByUser: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  return EDITORIAL_CHECKLIST_ITEMS.map((definition) => {
    const item = rows.find((row: (typeof rows)[number]) => row.itemKey === definition.key);
    return {
      key: definition.key,
      label: definition.label,
      isCompleted: Boolean(item?.isCompleted),
      completedAt: item?.completedAt ?? null,
      completedBy: item?.completedByUser ?? null,
    };
  });
}

export async function listEditorialComments(postId: number) {
  return db.query.editorialComments.findMany({
    where: eq(editorialComments.postId, postId),
    orderBy: [desc(editorialComments.createdAt)],
    with: {
      author: {
        columns: {
          id: true,
          name: true,
        },
      },
      resolver: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function listAssignableEditors() {
  return db.query.user.findMany({
    where: inArray(user.role, ["editor", "admin", "super-admin"]),
    columns: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: [user.name],
  });
}
