import { createFileRoute } from '@tanstack/react-router'
import { db } from "#/db/index"
import { eq, desc, type InferSelectModel } from 'drizzle-orm'
import { pages, posts } from '#/db/schema'

type Post = InferSelectModel<typeof posts>
type Page = InferSelectModel<typeof pages>

export const Route = createFileRoute('/sitemap/xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const baseUrl = `${url.protocol}//${url.host}`

        const [allPosts, allPages] = await Promise.all([
          db.query.posts.findMany({
            where: eq(posts.status, 'published'),
            orderBy: [desc(posts.publishedAt)],
            columns: {
              slug: true,
              updatedAt: true,
            }
          }),
          db.query.pages.findMany({
            where: eq(pages.status, 'published'),
            orderBy: [desc(pages.updatedAt)],
            columns: {
              slug: true,
              updatedAt: true,
              isHome: true,
            }
          }),
        ])

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
    .filter((page: Partial<Page>) => !page.isHome)
    .map((page: Partial<Page>) => `
  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${page.updatedAt?.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${allPosts.map((post: Partial<Post>) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt?.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

        return new Response(sitemap, {
          headers: {
            'Content-Type': 'application/xml',
          },
        })
      }
    }
  }
})
