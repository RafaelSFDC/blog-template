import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
// @ts-ignore
import { getEvent } from 'vinxi/http'

let _db: any = null

export function setDb(d1: any) {
  _db = drizzleD1(d1, { schema })
}

/**
 * Global database proxy that resolves the D1 binding per request.
 * Falls back to local 'blog.db' if not in a Cloudflare environment.
 */
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === 'schema') return schema
    
    // If already initialized (e.g. via setDb or previous call)
    if (_db) return (_db as any)[prop]

    let d1: any | undefined

    try {
      const event = getEvent()
      d1 = event?.context?.cloudflare?.env?.DB || event?.context?.env?.DB
    } catch (e) {
      // Not in a request context
    }

    if (d1) {
      _db = drizzleD1(d1, { schema })
      return (_db as any)[prop]
    }

    // Fallback for local development/scripts
    if (process.env.NODE_ENV !== 'production' || !process.env.CF_PAGES) {
      if (!_db) {
        const sqlite = new Database('blog.db')
        _db = drizzleSqlite(sqlite, { schema })
      }
      return (_db as any)[prop]
    }

    return new Proxy({} as any, {
      get(_t, p) {
        if (p === 'then') return undefined
        throw new Error(
          `Database binding 'DB' not found for property '${String(p)}'. ` +
          "Ensure you are running in a Cloudflare environment or have initialized the DB."
        )
      }
    })
  }
})

export { schema }
