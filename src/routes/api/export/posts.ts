import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db/index'
import { requireAdminSession } from '#/lib/admin-auth'

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
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
