import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const user = sqliteTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text(),
  role: text('role').default('user'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const session = sqliteTable(
  'sessions',
  {
    id: text().primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    token: text().notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('sessions_userId_idx').on(table.userId)],
)

export const account = sqliteTable(
  'accounts',
  {
    id: text().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp',
    }),
    scope: text(),
    password: text(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => [index('accounts_userId_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verifications',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)
export const categories = sqliteTable('categories', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
})

export const tags = sqliteTable('tags', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
})

export const media = sqliteTable('media', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  url: text().notNull(),
  altText: text('alt_text'),
  filename: text().notNull(),
  mimeType: text('mime_type'),
  size: integer(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const posts = sqliteTable('posts', {
  id: integer({ mode: 'number' }).primaryKey({
    autoIncrement: true,
  }),
  slug: text().notNull().unique(),
  title: text().notNull(),
  excerpt: text().notNull(),
  content: text().notNull(), // Markdown or HTML content
  coverImage: text('cover_image'),
  featuredImageId: integer('featured_image_id').references(() => media.id),
  status: text().notNull().default('draft'), // draft, published, scheduled, private
  readingTime: integer('reading_time'),
  viewCount: integer('view_count').notNull().default(0),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImage: text('og_image'),
  authorId: text('author_id').references(() => user.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const comments = sqliteTable('comments', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email'),
  content: text().notNull(),
  status: text().notNull().default('pending'), // pending, approved, spam
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
}, (table) => [
  index('comments_post_id_idx').on(table.postId)
])

export const postCategories = sqliteTable('post_categories', {
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => [
  index('post_categories_idx').on(table.postId, table.categoryId)
])

export const postTags = sqliteTable('post_tags', {
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  index('post_tags_idx').on(table.postId, table.tagId)
])

export const appSettings = sqliteTable('app_settings', {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})
