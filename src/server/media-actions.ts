import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { media as mediaTable } from '#/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAdminSession } from '#/lib/admin-auth'
import { getBinding } from '#/lib/cf-env'

export const getMediaItems = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    return await db.select().from(mediaTable).orderBy(desc(mediaTable.createdAt))
  })

export const uploadMedia = createServerFn({ method: 'POST' })
  .inputValidator((data: any) => data)
  .handler(async ({ data }: { data: FormData }) => {
    await requireAdminSession()
    const storage = getBinding('STORAGE')

    if (!storage) {
      throw new Error('Storage not configured')
    }

    const file = data.get('file') as File
    const altText = data.get('altText') as string | null
    
    if (!file) {
      throw new Error('No file provided')
    }

    const filename = `${Date.now()}-${file.name}`
    
    // Upload to R2
    await storage.put(filename, file, {
      httpMetadata: {
        contentType: file.type,
      }
    })

    const url = `/api/media/${filename}`

    // Save to DB
    const created = await db.insert(mediaTable).values({
      url,
      filename,
      altText: altText || null,
      mimeType: file.type,
      size: file.size,
    }).returning()

    return created[0]
  })

export const deleteMediaItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number, filename: string }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    const storage = getBinding('STORAGE')

    if (!storage) {
      throw new Error('Storage not configured')
    }

    // Delete from R2
    await storage.delete(data.filename)

    // Delete from DB
    await db.delete(mediaTable).where(eq(mediaTable.id, data.id))

    return { success: true }
  })
