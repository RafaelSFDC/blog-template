import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "#/db/index";
import { pages } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  getFriendlyDbError,
  normalizeSlug,
  pageServerSchema,
} from "#/lib/cms-schema";
import { captureServerException } from "#/server/sentry";

export const getPages = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return db.select().from(pages).orderBy(desc(pages.updatedAt), asc(pages.title));
});

export const getPageById = createServerFn({ method: "GET" })
  .inputValidator((id: number) => id)
  .handler(async ({ data }) => {
    await requireAdminSession();
    return db.query.pages.findFirst({
      where: eq(pages.id, data),
    });
  });

export const createPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pageServerSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();

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
  .inputValidator((input: unknown) => pageServerSchema.safeExtend({
    id: pageServerSchema.shape.id.unwrap(),
  }).parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();

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

export const deletePage = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession();
    await db.delete(pages).where(eq(pages.id, data.id));
    return { ok: true as const };
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
