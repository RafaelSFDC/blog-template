import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db/index'
import { comments } from '#/db/schema'

import { getAuthSession } from '#/lib/admin-auth'

export const Route = createFileRoute('/api/comments')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { postId, authorName, authorEmail, content } = body
          
          const session = await getAuthSession()
          const authorId = session?.user?.id

          if (!postId || (!authorName && !authorId) || !content) {
            return new Response('Missing required fields', { status: 400 })
          }

          const [newComment] = await db
            .insert(comments)
            .values({
              postId: Number(postId),
              authorId,
              authorName: authorName || session?.user?.name || 'Anonymous',
              authorEmail: authorEmail || session?.user?.email,
              content,
              status: 'pending',
            })
            .returning()

          return Response.json(newComment)
        } catch (error: unknown) {
          console.error('Error creating comment:', error)
          const message = error instanceof Error ? error.message : 'Internal Server Error'
          return new Response(message, { status: 500 })
        }
      },
    }
  }
})

