import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
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

    // 1. Cloudflare D1 Detection (Native or Local Simulation)
    if (dbType === 'd1') {
      try {
        // Try to get the D1 binding from Vinxi context
        // @ts-ignore
        const { getEvent } = requireInstance('vinxi/http')
        const event = getEvent()
        const foundD1 = event?.context?.cloudflare?.env?.DB || event?.context?.env?.DB || process.env.DB
        
        if (foundD1) {
          const { drizzle: drizzleD1 } = requireInstance('drizzle-orm/d1')
          _db = drizzleD1(foundD1, { schema })
          return (_db as any)[prop]
        }
      } catch (e) {
        // Fallback if vinxi is not available
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

    // 4. Default / SQLite (better-sqlite3)
    if (!_db) {
      const Database = requireInstance('better-sqlite3')
      const sqlite = new Database(dbUrl || 'blog.db')
      _db = drizzleSqlite(sqlite, { schema })
    }

    return (_db as any)[prop]
  }
})

export { schema }
