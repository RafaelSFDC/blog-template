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
 * Global database proxy that resolves the D1 binding per request.
 * Falls back to local 'blog.db' if not in a Cloudflare environment.
 */
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === 'schema') return schema
    
    // If already initialized (e.g. via setDb or previous call)
    if (_db) return (_db as any)[prop]

    let d1: any | undefined

    // For TanStack Start / Vinxi on the server
    try {
      // Use dynamic import to prevent bundling vinxi/http into the client
      // @ts-ignore
      import('vinxi/http').then(({ getEvent }) => {
        const event = getEvent()
        const foundD1 = event?.context?.cloudflare?.env?.DB || event?.context?.env?.DB
        if (foundD1 && !_db) {
           import('drizzle-orm/d1').then(({ drizzle: drizzleD1 }) => {
             _db = drizzleD1(foundD1, { schema })
           })
        }
      }).catch(() => {
        // Not in an environment where vinxi/http is available (e.g. client)
      })
    } catch (e) {
      // Silent catch for environment detection
    }

    if (d1) {
      import('drizzle-orm/d1').then(({ drizzle: drizzleD1 }) => {
        _db = drizzleD1(d1, { schema })
      })
      return (_db as any)[prop]
    }

    // Fallback for local development/scripts
    if (process.env.NODE_ENV !== 'production' || !process.env.CF_PAGES) {
      if (!_db) {
        // Use requireInstance for better-sqlite3 as it's a native module in an ESM environment
        const Database = requireInstance('better-sqlite3')
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
