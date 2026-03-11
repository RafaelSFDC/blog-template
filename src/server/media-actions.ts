import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { media as mediaTable } from '#/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAdminSession } from '#/lib/admin-auth'
import {
  deleteObject,
  putObject,
  sanitizeMediaFilename,
} from '#/lib/storage'
import { mediaUploadSchema } from '#/lib/cms-schema'

export const getMediaItems = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    return await db.select().from(mediaTable).orderBy(desc(mediaTable.createdAt))
  })

export const uploadMedia = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }: { data: FormData }) => {
    await requireAdminSession()

    const file = data.get('file') as File
    const altText = data.get('altText') as string | null

    if (!file) {
      throw new Error('No file provided')
    }

    mediaUploadSchema.parse({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      altText: altText ?? undefined,
    })

    const filename = sanitizeMediaFilename(file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    const stored = await putObject({
      filename,
      body: buffer,
      contentType: file.type,
    })

    // Save to DB
    const created = await db.insert(mediaTable).values({
      url: stored.publicUrl,
      filename,
      altText: altText?.trim() || null,
      mimeType: file.type,
      size: file.size,
    }).returning()

    return created[0]
  })

export const deleteMediaItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number, filename: string }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await deleteObject(data.filename)

    // Delete from DB
    await db.delete(mediaTable).where(eq(mediaTable.id, data.id))

    return { success: true }
  })
