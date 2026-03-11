import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db/index";
import { eq, desc } from "drizzle-orm";
import { posts } from "#/db/schema";
import { getGlobalSiteData } from "#/lib/cms";
import { resolveSiteUrl } from "#/lib/seo";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', '&quot;')
    .replaceAll("'", "&apos;");
}

export const Route = createFileRoute("/rss/xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const site = await getGlobalSiteData();
        const baseUrl = resolveSiteUrl(site.siteUrl, request.url);

        const latestPosts = await db.query.posts.findMany({
          where: eq(posts.status, "published"),
          orderBy: [desc(posts.publishedAt)],
          limit: 20,
        });

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(site.blogName)}</title>
  <link>${baseUrl}</link>
  <description>${escapeXml(site.defaultMetaDescription || site.blogDescription)}</description>
  <language>pt-br</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
  ${latestPosts
    .map(
      (post) => `
  <item>
    <title>${escapeXml(post.title || "")}</title>
    <link>${baseUrl}/blog/${post.slug}</link>
    <guid>${baseUrl}/blog/${post.slug}</guid>
    <pubDate>${post.publishedAt?.toUTCString()}</pubDate>
    <description><![CDATA[${post.excerpt || ""}]]></description>
  </item>`,
    )
    .join("")}
</channel>
</rss>`;

        return new Response(rss, {
          headers: {
            "Content-Type": "application/xml",
          },
        });
      },
    },
  },
});
