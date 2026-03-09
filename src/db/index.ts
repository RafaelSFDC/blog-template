import * as schema from "./schema";

let _db: any = null;

const dbType = process.env.DB_TYPE || "sqlite";
const dbUrl = process.env.DATABASE_URL;

// Perform top-level initialization based on environment
if (dbType === "d1") {
  try {
    // @ts-ignore
    const { env } = await import("cloudflare:workers");
    const foundD1 = env?.DB;
    if (foundD1) {
      const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
      _db = drizzleD1(foundD1, { schema });
    }
  } catch (e) {
    // This may fail in local environments where cloudflare:workers isn't available
    console.debug("D1 initialization skipped or failed:", e);
  }
} else if (dbType === "neon") {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle: drizzleNeon } = await import("drizzle-orm/neon-http");
  const sql = neon(dbUrl!);
  _db = drizzleNeon(sql, { schema });
} else if (dbType === "libsql") {
  const { createClient } = await import("@libsql/client");
  const { drizzle: drizzleLibsql } = await import("drizzle-orm/libsql");
  const client = createClient({
    url: dbUrl!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  _db = drizzleLibsql(client, { schema });
} else if (dbType === "sqlite" || !_db) {
  try {
    const { drizzle: drizzleSqlite } =
      await import("drizzle-orm/better-sqlite3");
    const { default: Database } = await import("better-sqlite3");
    const sqlite = new Database(dbUrl || "blog.db");
    _db = drizzleSqlite(sqlite, { schema });
  } catch (e) {
    console.debug(
      "SQLite initialization failed (likely running in environment without better-sqlite3):",
      e,
    );
  }
}

/**
 * Universal Database Adapter
 * Supports: sqlite, d1, neon, libsql
 */
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === "schema") return schema;
    if (_db) return (_db as any)[prop];

    // Fallback if not initialized yet (shouldn't happen with top-level await unless all failed)
    throw new Error(
      `Database driver for "${dbType}" not initialized or failed to load.`,
    );
  },
});

export { schema };
