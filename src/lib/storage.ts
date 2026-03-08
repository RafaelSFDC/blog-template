import { createServerFn } from '@tanstack/react-start'
// @ts-ignore
import { getEvent } from 'vinxi/http'

export const uploadMedia = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')
    return { file }
  })
  .handler(async ({ data }: { data: { file: File } }) => {


    const event = getEvent()
    const storage = event.context.cloudflare?.env?.STORAGE || event.context.env?.STORAGE

    if (!storage) {
      throw new Error("R2 Bucket 'STORAGE' not found in environment.")
    }

    const file = data.file


    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    
    await storage.put(filename, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      }
    })

    // Return the URL. For Cloudflare Pages, we'll need a way to serve this.
    // For now, let's return a relative path that we'll handle with a route.
    return {
      url: `/api/media/${filename}`,
      filename
    }
  })
