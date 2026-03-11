import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db/index'
import { comments } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdminSession } from '#/lib/admin-auth'

export const Route = createFileRoute('/api/comments/$id')({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        try {
          // Check for admin session
          await requireAdminSession()

          const id = Number(params.id)
          const body = await request.json()
          const { status } = body

          if (!status || !['approved', 'spam', 'pending'].includes(status)) {
            return new Response('Invalid status', { status: 400 })
          }

          const [updatedComment] = await db
            .update(comments)
            .set({ status })
            .where(eq(comments.id, id))
            .returning()

          if (!updatedComment) {
            return new Response('Comment not found', { status: 404 })
          }

          return Response.json(updatedComment)
        } catch (error: unknown) {
          console.error('Error updating comment:', error)
          const err = error as { message?: string; status?: number }
          if (err.message === 'Unauthorized' || err.status === 401) {
             return new Response('Unauthorized', { status: 401 })
          }
          return new Response(err.message || 'Internal Server Error', { status: 500 })
        }
      },
      DELETE: async ({ params }) => {
        try {
          // Check for admin session
          await requireAdminSession()

          const id = Number(params.id)

          const [deletedComment] = await db
            .delete(comments)
            .where(eq(comments.id, id))
            .returning()

          if (!deletedComment) {
            return new Response('Comment not found', { status: 404 })
          }

          return Response.json({ message: 'Comment deleted successfully' })
        } catch (error: unknown) {
          console.error('Error deleting comment:', error)
          const err = error as { message?: string; status?: number }
          if (err.message === 'Unauthorized' || err.status === 401) {
             return new Response('Unauthorized', { status: 401 })
          }
          return new Response(err.message || 'Internal Server Error', { status: 500 })
        }
      },
    }
  }
})
