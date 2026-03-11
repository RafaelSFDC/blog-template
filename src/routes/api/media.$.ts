import { createFileRoute } from '@tanstack/react-router'
import { getObject } from '#/lib/storage'

export const Route = createFileRoute('/api/media/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const filename = url.pathname.split('/').pop()

        if (!filename) {
          return new Response('File not found', { status: 404 })
        }

        try {
          const object = await getObject(filename)
          if (!object) {
            return new Response('File not found', { status: 404 })
          }

          const headers = new Headers()
          headers.set('cache-control', 'public, max-age=31536000')
          if (object.contentType) headers.set('content-type', object.contentType)
          if (object.etag) headers.set('etag', object.etag)

          return new Response(object.body, { headers })
        } catch (error) {
          console.error('Error fetching media object:', error)
          return new Response('Error fetching file', { status: 500 })
        }
      }
    }
  }
})
