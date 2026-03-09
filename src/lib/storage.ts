import { createServerFn } from '@tanstack/react-start'
import fs from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export const uploadMedia = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')
    return { file }
  })
  .handler(async ({ data }: { data: { file: File } }) => {
    const { getBinding } = await import('#/lib/cf-env')
    
    // 1. Check for Worker Bindings (Inside Cloudflare)
    const storage = getBinding('STORAGE')

    // 2. Check for S3-compatible R2 API (Outside Cloudflare)
    const r2Config = {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      accountId: process.env.R2_ACCOUNT_ID,
      bucketName: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL,
    }

    const isR2ApiConfigured = r2Config.accessKeyId && r2Config.secretAccessKey && r2Config.accountId && r2Config.bucketName

    const file = data.file
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const buffer = Buffer.from(await file.arrayBuffer())

    if (storage) {
      // Use Worker Bindings
      await storage.put(filename, buffer, {
        httpMetadata: {
          contentType: file.type,
        }
      })
      return {
        url: `/api/media/${filename}`,
        filename
      }
    } else if (isR2ApiConfigured) {
      // Use S3-compatible API
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2Config.accessKeyId!,
          secretAccessKey: r2Config.secretAccessKey!,
        },
      })

      await s3.send(new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      }))

      return {
        url: r2Config.publicUrl ? `${r2Config.publicUrl}/${filename}` : `/api/media/${filename}`,
        filename
      }
    } else {
      // Local fallback for dev
      const uploadDir = path.resolve(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      fs.writeFileSync(path.join(uploadDir, filename), buffer)
      return {
        url: `/uploads/${filename}`,
        filename
      }
    }
  })
