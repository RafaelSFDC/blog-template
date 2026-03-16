import { describe, expect, it } from "vitest";
import {
  buildHomepageFallbackContent,
  buildTemplatePageValues,
  getPresetMenus,
  getSitePresetDefinition,
  resolveSitePresetKey,
} from "#/lib/site-presets";
import { parsePuckData } from "#/lib/puck";

describe("site-presets", () => {
  it("falls back to creator-journal when the preset key is missing", () => {
    expect(resolveSitePresetKey(undefined)).toBe("creator-journal");
    expect(resolveSitePresetKey("unknown")).toBe("creator-journal");
  });

  it("returns preset-specific menus", () => {
    const menus = getPresetMenus("premium-publication");

    expect(menus.primaryMenu[1]?.href).toBe("/members-only-archive");
    expect(menus.footerMenu).toHaveLength(3);
  });

  it("builds launch-ready puck payloads for homepage templates", () => {
    const values = buildTemplatePageValues({
      presetKey: "magazine-newsletter",
      templateKey: "home",
      blogName: "Dispatch",
      blogDescription: "A sharper weekly publication.",
    });

    const parsed = parsePuckData(values.content);
    expect(values.useVisualBuilder).toBe(true);
    expect(values.isHome).toBe(true);
    expect(parsed?.content.length).toBeGreaterThan(2);
  });

  it("builds preset-aware fallback copy", () => {
    const fallback = buildHomepageFallbackContent({
      presetKey: "creator-journal",
      blogName: "Field Notes",
      blogDescription: "",
    });

    expect(fallback.badge).toBe(getSitePresetDefinition("creator-journal").badge);
    expect(fallback.title).toBe("Field Notes");
  });
});
