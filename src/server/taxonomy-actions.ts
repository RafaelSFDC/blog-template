import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { categories, tags } from '#/db/schema'
import { requireAdminSession } from '#/lib/admin-auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
})

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
})

// Categories
export const getCategories = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    return await db.select().from(categories)
  })

export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof categorySchema>) => categorySchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdminSession()
    const result = await db.insert(categories).values(data).returning()
    return result[0]
  })

export const updateCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number, data: z.infer<typeof categorySchema> }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    const result = await db.update(categories)
      .set(data.data)
      .where(eq(categories.id, data.id))
      .returning()
    return result[0]
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.delete(categories).where(eq(categories.id, data.id))
    return { success: true }
  })

// Tags
export const getTags = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    return await db.select().from(tags)
  })

export const createTag = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof tagSchema>) => tagSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdminSession()
    const result = await db.insert(tags).values(data).returning()
    return result[0]
  })

export const updateTag = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number, data: z.infer<typeof tagSchema> }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    const result = await db.update(tags)
      .set(data.data)
      .where(eq(tags.id, data.id))
      .returning()
    return result[0]
  })

export const deleteTag = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.delete(tags).where(eq(tags.id, data.id))
    return { success: true }
  })
