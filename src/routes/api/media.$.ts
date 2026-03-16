import { createFileRoute } from '@tanstack/react-router'
import { getObject } from '#/server/system/storage'
import { captureServerException } from '#/server/sentry'

export const Route = createFileRoute('/api/media/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const filename = url.pathname.split('/').pop()
        const preset = url.searchParams.get('preset')

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
          headers.set('vary', 'accept')
          if (preset) headers.set('x-lumina-image-preset', preset)
          if (object.contentType) headers.set('content-type', object.contentType)
          if (object.etag) headers.set('etag', object.etag)

          return new Response(object.body, { headers })
        } catch (error) {
          captureServerException(error, {
            tags: {
              area: 'api',
              flow: 'media-fetch',
            },
            extras: {
              requestUrl: request.url,
              filename,
            },
          })
          console.error('Error fetching media object:', error)
          return new Response('Error fetching file', { status: 500 })
        }
      }
    }
  }
})
