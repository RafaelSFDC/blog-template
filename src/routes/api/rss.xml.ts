import { createFileRoute } from '@tanstack/react-router'
import { db } from "#/db/index"
import { eq, desc } from 'drizzle-orm'
import { posts } from '../../db/schema'

export const Route = createFileRoute('/api/rss/xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const baseUrl = `${url.protocol}//${url.host}`

        const latestPosts = await db.query.posts.findMany({
          where: eq(posts.status, 'published'),
          orderBy: [desc(posts.publishedAt)],
          limit: 20,
        })

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Meu Blog Alternativo</title>
  <link>${baseUrl}</link>
  <description>Um blog moderno construído com TanStack Start</description>
  <language>pt-br</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/api/rss.xml" rel="self" type="application/rss+xml" />
  ${latestPosts.map((post: any) => `
  <item>
    <title>${post.title}</title>
    <link>${baseUrl}/blog/${post.slug}</link>
    <guid>${baseUrl}/blog/${post.slug}</guid>
    <pubDate>${post.publishedAt?.toUTCString()}</pubDate>
    <description><![CDATA[${post.excerpt}]]></description>
  </item>`).join('')}
</channel>
</rss>`

        return new Response(rss, {
          headers: {
            'Content-Type': 'application/xml',
          },
        })
      }
    }
  }
})
