import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db/index'
import { posts } from '#/db/schema'
import { eq, and, lte } from 'drizzle-orm'
// @ts-ignore
import { getEvent } from 'vinxi/http'

export const Route = createFileRoute('/api/cron/publish')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const secret = url.searchParams.get('secret')
        
        const event = getEvent()
        const expectedSecret = event.context.cloudflare?.env?.CRON_SECRET || event.context.env?.CRON_SECRET || 'dev-secret'

        if (secret !== expectedSecret) {
          return new Response('Unauthorized', { status: 401 })
        }

        try {
          const now = new Date()
          
          // Find posts that are scheduled and whose publication date has passed (or is now)
          const toPublish = await db
            .select()
            .from(posts)
            .where(
              and(
                eq(posts.status, 'scheduled'),
                lte(posts.publishedAt, now)
              )
            )

          if (toPublish.length === 0) {
            return Response.json({ message: 'No posts to publish', count: 0 })
          }

          // Update them to published
          let publishedCount = 0
          for (const post of toPublish) {
            await db
              .update(posts)
              .set({ 
                status: 'published',
                updatedAt: new Date()
              })
              .where(eq(posts.id, post.id))
            publishedCount++
          }

          return Response.json({ 
            message: 'Successfully published posts', 
            count: publishedCount,
            publishedIds: toPublish.map((p: any) => p.id)
          })
        } catch (error: any) {
          console.error('Error in cron publish:', error)
          return new Response(error.message || 'Internal Server Error', { status: 500 })
        }
      }
    }
  }
})
