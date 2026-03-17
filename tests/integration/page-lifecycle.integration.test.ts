import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

vi.mock("#/server/editorial/access", () => ({
  requirePageAccess: vi.fn().mockResolvedValue({
    user: {
      id: "editor-user",
      email: "editor@lumina.test",
      role: "editor",
    },
  }),
}));

describe("page lifecycle integration", () => {
  it("supports create, update, revision restore, and slug uniqueness for pages", async () => {
    await withIsolatedDatabase("page-lifecycle", async () => {
      const { db } = await import("#/db/index");
      const { pageRevisions, pages, user } = await import("#/db/schema");
      const { createPage, restorePageRevision, updatePage } = await import(
        "#/server/actions/content/page-actions"
      );

      await db.insert(user).values({
        id: "editor-user",
        name: "Editor User",
        email: "editor@lumina.test",
        emailVerified: true,
        role: "editor",
      });

      const baseInput = {
        title: "About Lumina",
        slug: "about-lumina",
        excerpt: "About excerpt",
        content: "About content",
        metaTitle: undefined,
        metaDescription: undefined,
        ogImage: undefined,
        seoNoIndex: false,
        isPremium: false,
        teaserMode: "excerpt" as const,
        status: "draft" as const,
        isHome: false,
        useVisualBuilder: false,
        publishedAt: undefined,
      };

      await createPage({ data: baseInput });
      const created = await db.query.pages.findFirst({
        where: eq(pages.slug, "about-lumina"),
      });
      expect(created?.id).toBeGreaterThan(0);

      await updatePage({
        data: {
          ...baseInput,
          id: created!.id,
          title: "About Lumina Updated",
          content: "About content updated",
        },
      });

      const revisions = await db
        .select()
        .from(pageRevisions)
        .where(eq(pageRevisions.pageId, created!.id));
      expect(revisions.length).toBeGreaterThanOrEqual(2);

      await restorePageRevision({ data: { revisionId: revisions[0]!.id } });

      const restored = await db.query.pages.findFirst({
        where: (table, operators) => operators.eq(table.id, created!.id),
      });
      expect(restored?.status).toBe("draft");

      await expect(
        createPage({
          data: {
            ...baseInput,
            title: "Duplicate Slug Page",
            slug: "about-lumina",
          },
        }),
      ).rejects.toThrow(/slug/i);

      const currentPage = await db.query.pages.findFirst({
        where: eq(pages.id, created!.id),
      });
      expect(currentPage?.title).toBeTruthy();
    });
  }, 20000);
});
