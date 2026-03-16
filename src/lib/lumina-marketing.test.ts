import { describe, expect, it } from "vitest";
import {
  buildLuminaProductSeo,
  formatLuminaBetaRequestMessage,
  getLuminaAudiencePage,
  resolveLuminaPrimaryCta,
} from "#/lib/lumina-marketing";

describe("lumina-marketing", () => {
  it("returns audience-specific copy", () => {
    const page = getLuminaAudiencePage("journalists");

    expect(page.href).toBe("/lumina/for-journalists");
    expect(page.wins.length).toBeGreaterThan(2);
  });

  it("resolves CTA targets consistently", () => {
    expect(resolveLuminaPrimaryCta("beta").href).toBe("/lumina/beta");
    expect(resolveLuminaPrimaryCta("pricing").label).toBe("See pricing");
  });

  it("formats beta requests into a structured message body", () => {
    const message = formatLuminaBetaRequestMessage({
      name: "Ana",
      email: "ana@example.com",
      role: "creator",
      publicationType: "independent_newsletter",
      currentStack: "Ghost + Substack",
      message: "I want a cleaner launch flow.",
    });

    expect(message).toContain("Role: creator");
    expect(message).toContain("Current stack: Ghost + Substack");
    expect(message).toContain("I want a cleaner launch flow.");
  });

  it("builds fixed product SEO metadata", () => {
    const seo = buildLuminaProductSeo({
      path: "/lumina",
      title: "Lumina | Publication OS",
      description: "Launch and monetize a publication.",
    });

    expect(seo.meta.some((entry) => "content" in entry && entry.content === "Lumina")).toBe(true);
    expect(seo.links).toEqual([{ rel: "canonical", href: "/lumina" }]);
  });
});
