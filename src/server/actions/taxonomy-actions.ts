import { createServerFn } from '@tanstack/react-start'
import { db } from '#/server/db/index'
import { categories, postCategories, posts, postTags, tags } from '#/server/db/schema'
import { requireTaxonomyAccess } from '#/server/editorial/access'
import { and, count, desc, eq } from 'drizzle-orm'
import { categorySchema, tagSchema } from '#/schemas/editorial'
import { getFriendlyDbError, normalizeSlug } from '#/schemas/system'
import { getPaginationMeta } from '#/lib/pagination'

export const BLOG_PAGE_SIZE = 9

// Categories
export const getCategories = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireTaxonomyAccess()
    return await db.select().from(categories)
  })

export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => categorySchema.parse(data))
  .handler(async ({ data }) => {
    await requireTaxonomyAccess()
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
    await requireTaxonomyAccess()
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
    await requireTaxonomyAccess()
    await db.delete(categories).where(eq(categories.id, data.id))
    return { success: true }
  })

// Tags
export const getTags = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireTaxonomyAccess()
    return await db.select().from(tags)
  })

export const createTag = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => tagSchema.parse(data))
  .handler(async ({ data }) => {
    await requireTaxonomyAccess()
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
    await requireTaxonomyAccess()
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
    await requireTaxonomyAccess()
    await db.delete(tags).where(eq(tags.id, data.id))
    return { success: true }
  })

export async function getPublishedCategoryBySlug(slug: string, page = 1) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  })

  if (!category) {
    return null
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(postCategories)
    .innerJoin(posts, eq(postCategories.postId, posts.id))
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(and(eq(categories.slug, slug), eq(posts.status, 'published')))

  const pagination = getPaginationMeta(total, page, BLOG_PAGE_SIZE)

  const categoryPosts = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
      category: categories.name,
      categorySlug: categories.slug,
    })
    .from(postCategories)
    .innerJoin(posts, eq(postCategories.postId, posts.id))
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(and(eq(categories.slug, slug), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(BLOG_PAGE_SIZE)
    .offset(pagination.offset)

  return {
    category,
    posts: categoryPosts,
    pagination,
  }
}

export async function getPublishedTagBySlug(slug: string, page = 1) {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  })

  if (!tag) {
    return null
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.status, 'published')))

  const pagination = getPaginationMeta(total, page, BLOG_PAGE_SIZE)

  const taggedPosts = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
    })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(BLOG_PAGE_SIZE)
    .offset(pagination.offset)

  return {
    tag,
    posts: taggedPosts,
    pagination,
  }
}

export async function getPublishedCategories() {
  return db.select().from(categories)
}

export async function getPublishedTags() {
  return db.select().from(tags)
}

