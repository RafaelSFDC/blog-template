import { describe, expect, it, vi } from "vitest";
import { asc, eq } from "drizzle-orm";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

vi.mock("#/server/auth/session", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: {
      id: "fixture-admin",
      email: "admin@lumina.test",
      role: "admin",
    },
  }),
}));

describe("menu actions integration", () => {
  it("saves ordered menu items and returns dashboard-friendly data", async () => {
    await withIsolatedDatabase("menu-actions", async () => {
      const { db } = await import("#/db/index");
      const { menuItems, menus, pages } = await import("#/db/schema");
      const { saveMenu } = await import("#/server/actions/content/menu-actions");

      await db.insert(pages).values([
        {
          slug: "about",
          title: "About",
          excerpt: "About page",
          content: "<p>About</p>",
          status: "published",
          isHome: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          slug: "contact",
          title: "Contact",
          excerpt: "Contact page",
          content: "<p>Contact</p>",
          status: "published",
          isHome: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await saveMenu({
        data: {
          key: "primary",
          items: [
            { label: "About", href: "/about", kind: "internal" },
            { label: "External Docs", href: "https://example.test/docs", kind: "external" },
          ],
        },
      });

      const primaryMenu = await db.query.menus.findFirst({
        where: eq(menus.key, "primary"),
      });
      const items = await db.query.menuItems.findMany({
        where: eq(menuItems.menuId, primaryMenu!.id),
        orderBy: [asc(menuItems.sortOrder)],
      });

      expect(primaryMenu).toBeTruthy();
      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        label: "About",
        href: "/about",
        kind: "internal",
        sortOrder: 0,
      });
      expect(items[1]).toMatchObject({
        label: "External Docs",
        href: "https://example.test/docs",
        kind: "external",
        sortOrder: 1,
      });
      const pageRows = await db.select().from(pages);
      expect(pageRows.map((entry: { slug: string }) => entry.slug)).toEqual(["about", "contact"]);
    });
  }, 15000);
});
