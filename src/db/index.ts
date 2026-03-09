import * as schema from './schema'
import { createRequire } from 'module'

const requireInstance = createRequire(import.meta.url)

let _db: any = null

export async function setDb(d1: any) {
  const { drizzle: drizzleD1 } = await import('drizzle-orm/d1')
  _db = drizzleD1(d1, { schema })
}

/**
 * Universal Database Adapter
 * Supports: sqlite, d1, neon, libsql
 * Configured via DB_TYPE and DATABASE_URL environment variables.
 */
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === 'schema') return schema
    if (_db) return (_db as any)[prop]

    const dbType = process.env.DB_TYPE || 'sqlite'
    const dbUrl = process.env.DATABASE_URL

    // 1. Cloudflare D1 Detection
    if (dbType === 'd1') {
      try {
        const { env } = requireInstance('cloudflare:workers')
        const foundD1 = env?.DB
        
        if (foundD1) {
          const { drizzle: drizzleD1 } = requireInstance('drizzle-orm/d1')
          _db = drizzleD1(foundD1, { schema })
          return (_db as any)[prop]
        } else {
          console.error('❌ D1 Binding "DB" not found!')
        }
      } catch (e) {
        console.error('Error initializing D1:', e)
      }
    }

    // 2. Neon (Postgres)
    if (dbType === 'neon') {
      const { neon } = requireInstance('@neondatabase/serverless')
      const { drizzle: drizzleNeon } = requireInstance('drizzle-orm/neon-http')
      const sql = neon(dbUrl!)
      _db = drizzleNeon(sql, { schema })
      return (_db as any)[prop]
    }

    // 3. LibSQL / Turso
    if (dbType === 'libsql') {
      const { createClient } = requireInstance('@libsql/client')
      const { drizzle: drizzleLibsql } = requireInstance('drizzle-orm/libsql')
      const client = createClient({ url: dbUrl!, authToken: process.env.DATABASE_AUTH_TOKEN })
      _db = drizzleLibsql(client, { schema })
      return (_db as any)[prop]
    }

    // 4. Default / SQLite (better-sqlite3) — only for local dev, NOT Workers
    if (!_db) {
      const { drizzle: drizzleSqlite } = requireInstance('drizzle-orm/better-sqlite3')
      const Database = requireInstance('better-sqlite3')
      const sqlite = new Database(dbUrl || 'blog.db')
      _db = drizzleSqlite(sqlite, { schema })
    }

    return (_db as any)[prop]
  }
})

export { schema }
