import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("seo routes integration", () => {
  it("keeps SEO route references aligned with the generated file-route paths", () => {
    const rootPath = path.resolve("src/routes/__root.tsx");
    const footerPath = path.resolve("src/components/Footer.tsx");
    const rssRoutePath = path.resolve("src/routes/rss.xml.ts");
    const sitemapRoutePath = path.resolve("src/routes/sitemap.xml.ts");

    const rootSource = fs.readFileSync(rootPath, "utf8");
    const footerSource = fs.readFileSync(footerPath, "utf8");
    const rssSource = fs.readFileSync(rssRoutePath, "utf8");
    const sitemapSource = fs.readFileSync(sitemapRoutePath, "utf8");

    expect(rootSource).toContain('href: "/rss/xml"');
    expect(rootSource).toContain('href: "/sitemap/xml"');
    expect(footerSource).toContain('href="/rss/xml"');
    expect(rssSource).toContain('createFileRoute("/rss/xml")');
    expect(sitemapSource).toContain('createFileRoute("/sitemap/xml")');
    expect(rssSource).toContain('"Content-Type": "application/xml"');
    expect(sitemapSource).toContain('"Content-Type": "application/xml"');
    expect(rssSource).toContain("<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>");
    expect(sitemapSource).toContain("post.updatedAt?.toISOString().split(\"T\")[0]");
    expect(sitemapSource).toContain("page.updatedAt?.toISOString().split(\"T\")[0]");
  });
});
