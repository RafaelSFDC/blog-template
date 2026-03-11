import * as schema from "./schema";
import { getBinding } from "#/lib/cf-env";

let _db: Record<string, unknown> | null = null;

const dbType = process.env.DB_TYPE || "sqlite";
const dbUrl = process.env.DATABASE_URL;

// Perform top-level initialization based on environment
if (dbType === "d1") {
  try {
    const foundD1 = getBinding("DB");
    if (foundD1) {
      const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
      _db = drizzleD1(foundD1, { schema }) as unknown as Record<
        string,
        unknown
      >;
    }
  } catch (e) {
    // This may fail in local environments where cloudflare:workers isn't available
    console.debug("D1 initialization skipped or failed:", e);
  }
} else if (dbType === "neon") {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle: drizzleNeon } = await import("drizzle-orm/neon-http");
  const sql = neon(dbUrl!);
  _db = drizzleNeon(sql, { schema }) as unknown as Record<string, unknown>;
} else if (dbType === "libsql") {
  const { createClient } = await import("@libsql/client");
  const { drizzle: drizzleLibsql } = await import("drizzle-orm/libsql");
  const client = createClient({
    url: dbUrl!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  _db = drizzleLibsql(client, { schema }) as unknown as Record<string, unknown>;
} else if (dbType === "sqlite" || !_db) {
  try {
    const { drizzle: drizzleSqlite } =
      await import("drizzle-orm/better-sqlite3");
    const { default: Database } = await import("better-sqlite3");
    const sqlite = new Database(dbUrl || "blog.db");
    _db = drizzleSqlite(sqlite, { schema }) as unknown as Record<
      string,
      unknown
    >;
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
const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === "schema") return schema;
    if (_db) return _db[prop as string];

    // Fallback if not initialized yet (shouldn't happen with top-level await unless all failed)
    throw new Error(
      `Database driver for "${dbType}" not initialized or failed to load.`,
    );
  },
});

export { db, schema };
