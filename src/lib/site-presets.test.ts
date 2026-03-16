import { describe, expect, it } from "vitest";
import {
  buildHomepageFallbackContent,
  buildTemplatePageValues,
  getLaunchTemplateOptions,
  getPresetMenus,
  getSitePresetDefinition,
  resolveSitePresetKey,
} from "#/lib/site-presets";
import { parsePuckData } from "#/lib/puck";

describe("site-presets", () => {
  it("normalizes legacy preset aliases to canonical keys", () => {
    expect(resolveSitePresetKey(undefined)).toBe("creator");
    expect(resolveSitePresetKey("unknown")).toBe("creator");
    expect(resolveSitePresetKey("creator-journal")).toBe("creator");
    expect(resolveSitePresetKey("magazine-newsletter")).toBe("magazine");
    expect(resolveSitePresetKey("premium-publication")).toBe("premium_publication");
  });

  it("returns preset-specific menus from canonical keys", () => {
    const premiumMenus = getPresetMenus("premium_publication");

    expect(premiumMenus.primaryMenu[1]?.href).toBe("/members-only-archive");
    expect(premiumMenus.footerMenu).toHaveLength(3);
  });

  it("builds launch-ready puck payloads for required homepage templates", () => {
    const values = buildTemplatePageValues({
      presetKey: "magazine",
      templateKey: "home",
      blogName: "Dispatch",
      blogDescription: "A sharper weekly publication.",
    });

    const parsed = parsePuckData(values.content);
    expect(values.useVisualBuilder).toBe(true);
    expect(values.isHome).toBe(true);
    expect(parsed?.content.length).toBeGreaterThan(2);
  });

  it("builds preset-aware fallback copy and featured framing", () => {
    const fallback = buildHomepageFallbackContent({
      presetKey: "creator",
      blogName: "Field Notes",
      blogDescription: "",
    });

    expect(fallback.badge).toBe(getSitePresetDefinition("creator").badge);
    expect(fallback.title).toBe("Field Notes");
    expect(fallback.featuredHeading).toBe("Latest Notes");
    expect(fallback.primaryCtaHref).toBe("/blog");
  });

  it("keeps members-only archive as an optional premium-only extension", () => {
    const premiumTemplates = getLaunchTemplateOptions({
      presetKey: "premium_publication",
      includeOptional: true,
    });
    const creatorTemplates = getLaunchTemplateOptions({
      presetKey: "creator",
      includeOptional: true,
    });
    const minimumTemplates = getLaunchTemplateOptions({
      presetKey: "premium_publication",
      includeOptional: false,
    });

    expect(premiumTemplates.some((template) => template.key === "membersOnlyArchive")).toBe(true);
    expect(creatorTemplates.some((template) => template.key === "membersOnlyArchive")).toBe(false);
    expect(minimumTemplates.some((template) => template.key === "membersOnlyArchive")).toBe(false);
    expect(minimumTemplates).toHaveLength(5);
  });
});
