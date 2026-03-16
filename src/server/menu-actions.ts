import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { db } from "#/db/index";
import { menuItems, menus, pages } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  assertMenuHref,
  menuUpdateSchema,
} from "#/schemas/system";
import { ensureCoreMenus } from "#/lib/cms";

export const getMenusForDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    await ensureCoreMenus();

    const [menuRows, menuItemRows, pageRows] = await Promise.all([
      db.select().from(menus).orderBy(asc(menus.id)),
      db.select().from(menuItems).orderBy(asc(menuItems.menuId), asc(menuItems.sortOrder), asc(menuItems.id)),
      db
        .select({
          id: pages.id,
          title: pages.title,
          slug: pages.slug,
          status: pages.status,
        })
        .from(pages)
        .orderBy(asc(pages.title)),
    ]);

    return {
      menus: menuRows.map((menu: (typeof menuRows)[number]) => ({
        ...menu,
        items: menuItemRows.filter((item: (typeof menuItemRows)[number]) => item.menuId === menu.id),
      })),
      pages: pageRows,
    };
  },
);

export const saveMenu = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => menuUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    await ensureCoreMenus();

    const menu = await db.query.menus.findFirst({
      where: eq(menus.key, data.key),
    });

    if (!menu) {
      throw new Error("Menu not found");
    }

    data.items.forEach((item) => {
      assertMenuHref(item.kind, item.href);
    });

    await db.delete(menuItems).where(eq(menuItems.menuId, menu.id));

    if (data.items.length > 0) {
      await db.insert(menuItems).values(
        data.items.map((item, index) => ({
          menuId: menu.id,
          label: item.label.trim(),
          href: item.href.trim(),
          kind: item.kind,
          sortOrder: index,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }

    await db
      .update(menus)
      .set({ updatedAt: new Date() })
      .where(eq(menus.id, menu.id));

    return { ok: true as const };
  });
