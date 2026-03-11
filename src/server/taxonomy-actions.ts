import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { categories, tags } from '#/db/schema'
import { requireAdminSession } from '#/lib/admin-auth'
import { eq } from 'drizzle-orm'
import { categorySchema, getFriendlyDbError, normalizeSlug, tagSchema } from '#/lib/cms-schema'

// Categories
export const getCategories = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    return await db.select().from(categories)
  })

export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => categorySchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdminSession()
    try {
      const result = await db.insert(categories).values({
        ...data,
        slug: normalizeSlug(data.slug, data.name),
      }).returning()
      return result[0]
    } catch (error) {
      throw new Error(getFriendlyDbError(error, 'Category') || 'Error creating category')
    }
  })

export const updateCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const parsed = data as { id: number; data: unknown }
    return {
      id: parsed.id,
      data: categorySchema.parse(parsed.data),
    }
  })
  .handler(async ({ data }) => {
    await requireAdminSession()
    try {
      const result = await db.update(categories)
        .set({
          ...data.data,
          slug: normalizeSlug(data.data.slug, data.data.name),
        })
        .where(eq(categories.id, data.id))
        .returning()
      return result[0]
    } catch (error) {
      throw new Error(getFriendlyDbError(error, 'Category') || 'Error updating category')
    }
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
  .inputValidator((data: unknown) => tagSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdminSession()
    try {
      const result = await db.insert(tags).values({
        ...data,
        slug: normalizeSlug(data.slug, data.name),
      }).returning()
      return result[0]
    } catch (error) {
      throw new Error(getFriendlyDbError(error, 'Tag') || 'Error creating tag')
    }
  })

export const updateTag = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const parsed = data as { id: number; data: unknown }
    return {
      id: parsed.id,
      data: tagSchema.parse(parsed.data),
    }
  })
  .handler(async ({ data }) => {
    await requireAdminSession()
    try {
      const result = await db.update(tags)
        .set({
          ...data.data,
          slug: normalizeSlug(data.data.slug, data.data.name),
        })
        .where(eq(tags.id, data.id))
        .returning()
      return result[0]
    } catch (error) {
      throw new Error(getFriendlyDbError(error, 'Tag') || 'Error updating tag')
    }
  })

export const deleteTag = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.delete(tags).where(eq(tags.id, data.id))
    return { success: true }
  })
