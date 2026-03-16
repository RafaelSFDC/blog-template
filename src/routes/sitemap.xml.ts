import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db/index";
import { eq, desc } from "drizzle-orm";
import { pages, posts } from "#/db/schema";
import { getPublishedCategories, getPublishedTags } from "#/server/taxonomy-actions";
import { getGlobalSiteData } from "#/server/system/site-data";
import { resolveSiteUrl } from "#/lib/seo";

type SitemapPost = Awaited<ReturnType<typeof db.query.posts.findMany>>[number];
type SitemapPage = Awaited<ReturnType<typeof db.query.pages.findMany>>[number];
type SitemapCategory = Awaited<ReturnType<typeof getPublishedCategories>>[number];
type SitemapTag = Awaited<ReturnType<typeof getPublishedTags>>[number];

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const site = await getGlobalSiteData();
        const baseUrl = resolveSiteUrl(site.siteUrl, request.url);

        const [allPosts, allPages, allCategories, allTags] = await Promise.all([
          db.query.posts.findMany({
            where: eq(posts.status, "published"),
            orderBy: [desc(posts.publishedAt)],
            columns: {
              slug: true,
              updatedAt: true,
            },
          }),
          db.query.pages.findMany({
            where: eq(pages.status, "published"),
            orderBy: [desc(pages.updatedAt)],
            columns: {
              slug: true,
              updatedAt: true,
              isHome: true,
            },
          }),
          getPublishedCategories(),
          getPublishedTags(),
        ]);

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  ${allPages
    .filter((page: SitemapPage) => !page.isHome)
    .map(
      (page: SitemapPage) => `
  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${page.updatedAt?.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("")}
  ${allPosts
    .map(
      (post: SitemapPost) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt?.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("")}
  ${allCategories
    .map(
      (category: SitemapCategory) => `
  <url>
    <loc>${baseUrl}/blog/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
    )
    .join("")}
  ${allTags
    .map(
      (tag: SitemapTag) => `
  <url>
    <loc>${baseUrl}/blog/tag/${tag.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>`,
    )
    .join("")}
</urlset>`;

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml",
          },
        });
      },
    },
  },
});
