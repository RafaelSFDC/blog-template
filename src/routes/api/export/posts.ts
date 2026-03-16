import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db/index'
import { requireAdminSession } from '#/server/auth/session'

export const Route = createFileRoute('/api/export/posts')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireAdminSession()
          
          const allPosts = await db.query.posts.findMany()
          
          const filename = `blog-backup-${new Date().toISOString().split('T')[0]}.json`
          
          return new Response(JSON.stringify(allPosts, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="${filename}"`
            }
          })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unauthorized'
          return new Response(JSON.stringify({ error: message }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
