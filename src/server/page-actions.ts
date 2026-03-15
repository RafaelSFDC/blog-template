import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "#/db/index";
import { pageRevisions, pages } from "#/db/schema";
import { requirePageAccess } from "#/lib/editorial-access";
import {
  getFriendlyDbError,
  normalizeSlug,
  pageServerSchema,
} from "#/lib/cms-schema";
import { captureServerException } from "#/server/sentry";
import { logActivity } from "#/server/activity-log";
import {
  acquireContentLock,
  createPageRevision,
  getContentLock,
  heartbeatContentLock,
  listPageRevisions,
  releaseContentLock,
  restorePageRevisionToDraft,
} from "#/server/editorial-workflows";

export const getPages = createServerFn({ method: "GET" }).handler(async () => {
  await requirePageAccess();
  return db.select().from(pages).orderBy(desc(pages.updatedAt), asc(pages.title));
});

export const getPageById = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    await requirePageAccess();
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, data),
    });

    if (!page) {
      return null;
    }

    const revisions = await listPageRevisions(page.id);
    const lock = await getContentLock({
      entityType: "page",
      entityId: page.id,
    });

    return {
      ...page,
      revisions,
      lock,
    };
  });

export const createPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pageServerSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requirePageAccess();

    const slug = normalizeSlug(data.slug, data.title);
    if (!slug) {
      throw new Error("Page slug could not be generated");
    }

    try {
      if (data.isHome) {
        await db.update(pages).set({ isHome: false, updatedAt: new Date() });
      }

      const [created] = await db
        .insert(pages)
        .values({
          slug,
          title: data.title.trim(),
          excerpt: data.excerpt,
          content: data.content.trim(),
          isPremium: data.isPremium,
          teaserMode: data.teaserMode,
          status: data.status,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage,
          isHome: data.isHome,
          publishedAt: data.status === "published" ? new Date() : data.publishedAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await createPageRevision({
        pageId: created.id,
        createdBy: session.user.id,
        source: data.status === "published" ? "publish" : "manual",
      });

      await logActivity({
        actorUserId: session.user.id,
        entityType: "page",
        entityId: created.id,
        action: "create",
        summary: `Page "${created.title}" created`,
        metadata: {
          slug,
          status: created.status,
          isHome: created.isHome,
          isPremium: created.isPremium,
        },
      });

      return created;
    } catch (error) {
      captureServerException(error, {
        tags: {
          area: "server",
          flow: "page-create",
        },
        extras: {
          slug,
          isHome: data.isHome,
          status: data.status,
        },
      });
      throw new Error(getFriendlyDbError(error, "Page") || "Could not create page");
    }
  });

export const updatePage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    pageServerSchema.safeExtend({
      id: pageServerSchema.shape.id.unwrap(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requirePageAccess();

    const slug = normalizeSlug(data.slug, data.title);
    if (!slug) {
      throw new Error("Page slug could not be generated");
    }

    try {
      if (data.isHome) {
        await db
          .update(pages)
          .set({ isHome: false, updatedAt: new Date() })
          .where(ne(pages.id, data.id));
      }

      const [updated] = await db
        .update(pages)
        .set({
          slug,
          title: data.title.trim(),
          excerpt: data.excerpt,
          content: data.content.trim(),
          isPremium: data.isPremium,
          teaserMode: data.teaserMode,
          status: data.status,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage,
          isHome: data.isHome,
          publishedAt: data.status === "published" ? new Date() : data.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, data.id))
        .returning();

      if (!updated) {
        throw new Error("Page not found");
      }

      await createPageRevision({
        pageId: updated.id,
        createdBy: session.user.id,
        source: updated.status === "published" ? "publish" : "manual",
      });

      await logActivity({
        actorUserId: session.user.id,
        entityType: "page",
        entityId: updated.id,
        action: "update",
        summary: `Page "${updated.title}" updated`,
        metadata: {
          slug,
          status: updated.status,
          isHome: updated.isHome,
          isPremium: updated.isPremium,
        },
      });

      return updated;
    } catch (error) {
      captureServerException(error, {
        tags: {
          area: "server",
          flow: "page-update",
        },
        extras: {
          pageId: data.id,
          slug,
          isHome: data.isHome,
          status: data.status,
        },
      });
      throw new Error(getFriendlyDbError(error, "Page") || "Could not update page");
    }
  });

export const autosavePage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    pageServerSchema.safeExtend({
      id: pageServerSchema.shape.id.unwrap(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requirePageAccess();

    const revision = await createPageRevision({
      pageId: data.id,
      createdBy: session.user.id,
      source: "autosave",
      snapshot: {
        title: data.title.trim(),
        slug: normalizeSlug(data.slug, data.title),
        excerpt: data.excerpt,
        content: data.content.trim(),
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        ogImage: data.ogImage ?? null,
        isPremium: data.isPremium,
        teaserMode: data.teaserMode,
        status: data.status,
        isHome: data.isHome,
        publishedAt: data.publishedAt ?? null,
      },
    });

    return {
      ok: true as const,
      revisionId: revision.id,
      savedAt: revision.createdAt,
    };
  });

export const restorePageRevision = createServerFn({ method: "POST" })
  .inputValidator((input: { revisionId: number }) => input)
  .handler(async ({ data }) => {
    const session = await requirePageAccess();
    const revision = await db.query.pageRevisions.findFirst({
      where: eq(pageRevisions.id, data.revisionId),
    });

    if (!revision) {
      throw new Error("Revision not found");
    }

    await restorePageRevisionToDraft(data.revisionId);
    await createPageRevision({
      pageId: revision.pageId,
      createdBy: session.user.id,
      source: "restore",
    });

    await logActivity({
      actorUserId: session.user.id,
      entityType: "page",
      entityId: revision.pageId,
      action: "revision.restore",
      summary: `Page revision ${data.revisionId} restored to draft`,
      metadata: {
        revisionId: data.revisionId,
      },
    });

    return {
      ok: true as const,
      pageId: revision.pageId,
    };
  });

export const deletePage = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const session = await requirePageAccess();
    const [deleted] = await db.delete(pages).where(eq(pages.id, data.id)).returning();

    if (deleted) {
      await logActivity({
        actorUserId: session.user.id,
        entityType: "page",
        entityId: deleted.id,
        action: "delete",
        summary: `Page "${deleted.title}" deleted`,
        metadata: {
          slug: deleted.slug,
        },
      });
    }

    return { ok: true as const };
  });

export const acquirePageLock = createServerFn({ method: "POST" })
  .inputValidator((input: { pageId: number }) => input)
  .handler(async ({ data }) => {
    const session = await requirePageAccess();
    return acquireContentLock({
      entityType: "page",
      entityId: data.pageId,
      userId: session.user.id,
    });
  });

export const heartbeatPageLock = createServerFn({ method: "POST" })
  .inputValidator((input: { pageId: number }) => input)
  .handler(async ({ data }) => {
    const session = await requirePageAccess();
    return heartbeatContentLock({
      entityType: "page",
      entityId: data.pageId,
      userId: session.user.id,
    });
  });

export const releasePageLock = createServerFn({ method: "POST" })
  .inputValidator((input: { pageId: number }) => input)
  .handler(async ({ data }) => {
    const session = await requirePageAccess();
    await releaseContentLock({
      entityType: "page",
      entityId: data.pageId,
      userId: session.user.id,
    });
    return { ok: true as const };
  });

export const getPageRevisionsForEditor = createServerFn({ method: "GET" })
  .inputValidator((input: { pageId: number }) => input)
  .handler(async ({ data }) => {
    await requirePageAccess();
    return listPageRevisions(data.pageId);
  });

export const getPagePreviewData = createServerFn({ method: "GET" })
  .inputValidator((input: { pageId: number }) => input)
  .handler(async ({ data }) => {
    await requirePageAccess();
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, data.pageId),
    });

    if (!page) {
      throw new Error("Page not found");
    }

    const latestRevision = await db.query.pageRevisions.findFirst({
      where: eq(pageRevisions.pageId, data.pageId),
      orderBy: [desc(pageRevisions.createdAt)],
    });

    return {
      id: page.id,
      title: latestRevision?.title ?? page.title,
      slug: latestRevision?.slug ?? page.slug,
      excerpt: latestRevision?.excerpt ?? page.excerpt ?? "",
      content: latestRevision?.content ?? page.content,
      metaTitle: latestRevision?.metaTitle ?? page.metaTitle ?? "",
      metaDescription: latestRevision?.metaDescription ?? page.metaDescription ?? "",
      ogImage: latestRevision?.ogImage ?? page.ogImage ?? "",
      isPremium: latestRevision?.isPremium ?? page.isPremium,
      teaserMode: latestRevision?.teaserMode ?? page.teaserMode,
      status: latestRevision?.status ?? page.status,
      isHome: latestRevision?.isHome ?? page.isHome,
      useVisualBuilder: false,
    };
  });

export async function getPublishedPageBySlug(slug: string) {
  return db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, "published")),
  });
}

export async function getPublishedHomepage() {
  return db.query.pages.findFirst({
    where: and(eq(pages.isHome, true), eq(pages.status, "published")),
  });
}
