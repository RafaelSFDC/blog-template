import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  image: text(),
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
  content: text().notNull(), // Markdown content
  authorId: text('author_id').references(() => users.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const appSettings = sqliteTable('app_settings', {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})
