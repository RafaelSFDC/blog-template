import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_DATA } from "#/lib/cms";
import {
  buildCanonicalUrl,
  buildPublicSeo,
  getRobotsMeta,
  resolveSiteUrl,
} from "#/lib/seo";

describe("seo", () => {
  it("builds canonical urls from the configured site url", () => {
    expect(buildCanonicalUrl("https://blog.example.com/", "/blog/post")).toBe(
      "https://blog.example.com/blog/post",
    );
  });

  it("falls back to request origin when no site url is configured", () => {
    expect(resolveSiteUrl("", "https://preview.example.com/blog")).toBe(
      "https://preview.example.com",
    );
  });

  it("returns noindex robots when indexing is disabled", () => {
    expect(getRobotsMeta(false)).toBe("noindex, nofollow");
  });

  it("builds SEO metadata with canonical and robots", () => {
    const seo = buildPublicSeo({
      site: {
        ...DEFAULT_SITE_DATA,
        blogName: "Lumina",
        siteUrl: "https://blog.example.com",
        defaultMetaDescription: "Editorial notes",
        robotsIndexingEnabled: false,
      },
      path: "/blog",
      title: "All Stories | Lumina",
      links: [{ rel: "next", href: "https://blog.example.com/blog?page=2" }],
    });

    expect(seo.links).toEqual([
      { rel: "canonical", href: "https://blog.example.com/blog" },
      { rel: "next", href: "https://blog.example.com/blog?page=2" },
    ]);
    expect(
      seo.meta.find((entry) => "name" in entry && entry.name === "robots"),
    ).toEqual({ name: "robots", content: "noindex, nofollow" });
  });
});
