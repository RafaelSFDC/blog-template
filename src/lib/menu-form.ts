import type { z } from "zod";
import type { getMenusForDashboard } from "#/server/actions/content/menu-actions";
import { menuUpdateSchema } from "#/schemas/system";

type MenuUpdateInput = z.input<typeof menuUpdateSchema>;
type DashboardMenusData = Awaited<ReturnType<typeof getMenusForDashboard>>;
type MenuRecord = DashboardMenusData["menus"][number];

export type EditableMenuItem = {
  id?: number;
  label: string;
  href: string;
  kind: "internal" | "external";
  sortOrder: number;
};

export type MenuEditorState = Record<string, EditableMenuItem[]>;

export function mapMenusToEditorState(menus: DashboardMenusData["menus"]): MenuEditorState {
  return Object.fromEntries(
    menus.map((menu: MenuRecord) => [
      menu.key,
      menu.items.map((item: MenuRecord["items"][number]) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        kind: item.kind as "internal" | "external",
        sortOrder: item.sortOrder,
      })),
    ]),
  ) as MenuEditorState;
}

export function createEmptyMenuItem(sortOrder: number): EditableMenuItem {
  return {
    label: "",
    href: "/",
    kind: "internal",
    sortOrder,
  };
}

export function normalizeMenuItemsForSave(
  items: EditableMenuItem[],
): MenuUpdateInput["items"] {
  return items.map((item, index) => ({
    ...item,
    label: item.label.trim(),
    href: item.href.trim(),
    sortOrder: index,
  }));
}
