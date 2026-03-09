import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db/index'
import { comments } from '#/db/schema'

export const Route = createFileRoute('/api/comments')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { postId, authorName, authorEmail, content } = body

          if (!postId || !authorName || !content) {
            return new Response('Missing required fields', { status: 400 })
          }

          const [newComment] = await db
            .insert(comments)
            .values({
              postId: Number(postId),
              authorName,
              authorEmail,
              content,
              status: 'pending',
            })
            .returning()

          return Response.json(newComment)
        } catch (error: any) {
          console.error('Error creating comment:', error)
          return new Response(error.message || 'Internal Server Error', { status: 500 })
        }
      },
    }
  }
})
