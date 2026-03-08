import { createServerFn } from '@tanstack/react-start'
// @ts-ignore
import { getEvent } from 'vinxi/http'
import fs from 'node:fs'
import path from 'node:path'

export const uploadMedia = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')
    return { file }
  })
  .handler(async ({ data }: { data: { file: File } }) => {
    const event = getEvent()
    const storage = event.context.cloudflare?.env?.STORAGE || event.context.env?.STORAGE

    const file = data.file
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

    if (storage) {
      await storage.put(filename, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type,
        }
      })
    } else {
      // Local fallback for dev without wrangler
      const uploadDir = path.resolve(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(path.join(uploadDir, filename), buffer)
    }

    return {
      url: storage ? `/api/media/${filename}` : `/uploads/${filename}`,
      filename
    }
  })
