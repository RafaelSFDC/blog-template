import { createFileRoute } from '@tanstack/react-router'
// @ts-ignore
import { getEvent } from 'vinxi/http'

export const Route = createFileRoute('/api/media/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const filename = url.pathname.split('/').pop()

        if (!filename) {
          return new Response('File not found', { status: 404 })
        }

        const event = getEvent()
        const storage = event.context.cloudflare?.env?.STORAGE || event.context.env?.STORAGE

        if (!storage) {
          return new Response('Storage not configured', { status: 500 })
        }

        const object = await storage.get(filename)

        if (!object) {
          return new Response('File not found', { status: 404 })
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('cache-control', 'public, max-age=31536000')

        return new Response(object.body, {
          headers
        })
      }
    }
  }
})
