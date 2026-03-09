import { createFileRoute } from '@tanstack/react-router'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

export const Route = createFileRoute('/api/media/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const filename = url.pathname.split('/').pop()

        if (!filename) {
          return new Response('File not found', { status: 404 })
        }

        const { getBinding } = await import('#/lib/cf-env')
        
        // 1. Try Worker Bindings
        const storage = getBinding('STORAGE')

        if (storage) {
          const object = await storage.get(filename)
          if (!object) return new Response('File not found', { status: 404 })

          const headers = new Headers()
          object.writeHttpMetadata(headers)
          headers.set('etag', object.httpEtag)
          headers.set('cache-control', 'public, max-age=31536000')

          return new Response(object.body, { headers })
        }

        // 2. Try R2 API
        const r2Config = {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          accountId: process.env.R2_ACCOUNT_ID,
          bucketName: process.env.R2_BUCKET_NAME,
        }

        if (r2Config.accessKeyId && r2Config.secretAccessKey && r2Config.accountId && r2Config.bucketName) {
          const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: r2Config.accessKeyId,
              secretAccessKey: r2Config.secretAccessKey,
            },
          })

          try {
            const response = await s3.send(new GetObjectCommand({
              Bucket: r2Config.bucketName,
              Key: filename,
            }))

            if (!response.Body) return new Response('File not found', { status: 404 })

            const headers = new Headers()
            headers.set('content-type', response.ContentType || 'application/octet-stream')
            headers.set('cache-control', 'public, max-age=31536000')
            if (response.ETag) headers.set('etag', response.ETag)

            return new Response(response.Body as BodyInit, { headers })
          } catch (e) {
            console.error('Error fetching from R2 API:', e)
            return new Response('Error fetching file', { status: 500 })
          }
        }

        return new Response('Storage not configured', { status: 500 })
      }
    }
  }
})
