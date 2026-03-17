import { asc, eq } from "drizzle-orm";
import { appSettings, menuItems, menus } from "#/db/schema";
import { db } from "#/db/index";
import { MENU_KEYS } from "#/schemas/system";
import type { GlobalSiteData, MenuItemView } from "#/types/system";
import { resolveSitePresetKey } from "#/lib/site-presets";

export type { GlobalSiteData } from "#/types/system";

export const DEFAULT_SITE_DATA: GlobalSiteData = {
  blogName: "Lumina",
  accentColor: "var(--primary)",
  fontFamily: "Inter",
  gaMeasurementId: "",
  plausibleDomain: "",
  blogLogo: "",
  twitterProfile: "",
  githubProfile: "",
  linkedinProfile: "",
  themeVariant: "default",
  blogDescription: "An elegant premium blog for creators.",
  siteUrl: "",
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  defaultOgImage: "",
  twitterHandle: "",
  sitePresetKey: "creator",
  robotsIndexingEnabled: true,
  socialLinks: [],
  primaryMenu: [],
  footerMenu: [],
};

export async function ensureCoreMenus() {
  for (const key of MENU_KEYS) {
    const existing = await db.query.menus.findFirst({
      where: eq(menus.key, key),
    });

    if (!existing) {
      await db.insert(menus).values({
        key,
        label: key === "primary" ? "Primary Navigation" : "Footer Navigation",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

export function normalizeBooleanSetting(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  return fallback;
}

export async function getGlobalSiteData(): Promise<GlobalSiteData> {
  await ensureCoreMenus();

  const [settingsRows, menuRows, menuItemRows] = await Promise.all([
    db.select().from(appSettings),
    db.select().from(menus),
    db
      .select({
        id: menuItems.id,
        menuId: menuItems.menuId,
        label: menuItems.label,
        href: menuItems.href,
        kind: menuItems.kind,
        sortOrder: menuItems.sortOrder,
      })
      .from(menuItems)
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.id)),
  ]);

  const settingsObj: Record<string, string> = {};
  settingsRows.forEach((row: { key: string; value: string }) => {
    settingsObj[row.key] = row.value;
  });

  let socialLinks: Array<{ platform: string; url: string }> = [];
  try {
    socialLinks = settingsObj["socialLinks"]
      ? (JSON.parse(settingsObj["socialLinks"]) as Array<{ platform: string; url: string }>)
      : [];
  } catch {
    socialLinks = [];
  }

  const menuIdByKey = new Map<string, number>(
    menuRows.map((row: { key: string; id: number }) => [row.key, row.id]),
  );
  const menuItemsByMenuId = new Map<number, MenuItemView[]>();

  menuItemRows.forEach((item: {
    id: number;
    menuId: number;
    label: string;
    href: string;
    kind: string;
    sortOrder: number;
  }) => {
    const list = menuItemsByMenuId.get(item.menuId) ?? [];
    list.push({
      id: item.id,
      label: item.label,
      href: item.href,
      kind: item.kind as "internal" | "external",
      sortOrder: item.sortOrder,
    });
    menuItemsByMenuId.set(item.menuId, list);
  });

  return {
    blogName: settingsObj["blogName"] || DEFAULT_SITE_DATA.blogName,
    accentColor: settingsObj["accentColor"] || DEFAULT_SITE_DATA.accentColor,
    fontFamily: settingsObj["fontFamily"] || DEFAULT_SITE_DATA.fontFamily,
    gaMeasurementId: settingsObj["gaMeasurementId"] || DEFAULT_SITE_DATA.gaMeasurementId,
    plausibleDomain: settingsObj["plausibleDomain"] || DEFAULT_SITE_DATA.plausibleDomain,
    blogLogo: settingsObj["blogLogo"] || DEFAULT_SITE_DATA.blogLogo,
    twitterProfile: settingsObj["twitterProfile"] || DEFAULT_SITE_DATA.twitterProfile,
    githubProfile: settingsObj["githubProfile"] || DEFAULT_SITE_DATA.githubProfile,
    linkedinProfile: settingsObj["linkedinProfile"] || DEFAULT_SITE_DATA.linkedinProfile,
    themeVariant: settingsObj["themeVariant"] || DEFAULT_SITE_DATA.themeVariant,
    blogDescription: settingsObj["blogDescription"] || DEFAULT_SITE_DATA.blogDescription,
    siteUrl: settingsObj["siteUrl"] || DEFAULT_SITE_DATA.siteUrl,
    defaultMetaTitle:
      settingsObj["defaultMetaTitle"] || DEFAULT_SITE_DATA.defaultMetaTitle,
    defaultMetaDescription:
      settingsObj["defaultMetaDescription"] || DEFAULT_SITE_DATA.defaultMetaDescription,
    defaultOgImage: settingsObj["defaultOgImage"] || DEFAULT_SITE_DATA.defaultOgImage,
    twitterHandle: settingsObj["twitterHandle"] || DEFAULT_SITE_DATA.twitterHandle,
    sitePresetKey: resolveSitePresetKey(settingsObj["sitePresetKey"]),
    robotsIndexingEnabled: normalizeBooleanSetting(
      settingsObj["robotsIndexingEnabled"],
      DEFAULT_SITE_DATA.robotsIndexingEnabled,
    ),
    socialLinks,
    primaryMenu: menuItemsByMenuId.get(menuIdByKey.get("primary") ?? -1) ?? [],
    footerMenu: menuItemsByMenuId.get(menuIdByKey.get("footer") ?? -1) ?? [],
  };
}
