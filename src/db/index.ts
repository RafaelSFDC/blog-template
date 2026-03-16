import * as schema from "./schema";
import { getBinding } from "#/server/system/cf-env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _sqliteClient: { close?: () => void } | null = null;

function getDatabaseConfig() {
  return {
    dbType: process.env.DB_TYPE || "sqlite",
    dbUrl: process.env.DATABASE_URL,
  };
}

async function importRuntimeModule<TModule>(specifier: string): Promise<TModule> {
  return import(/* @vite-ignore */ specifier) as Promise<TModule>;
}

async function initializeDb() {
  const { dbType, dbUrl } = getDatabaseConfig();

  if (dbType === "d1") {
    const foundD1 = getBinding("DB");
    if (foundD1) {
      const { drizzle: drizzleD1 } =
        await importRuntimeModule<typeof import("drizzle-orm/d1")>("drizzle-orm/d1");
      _db = drizzleD1(foundD1 as never, { schema }) as unknown as Record<string, unknown>;
      return;
    }
  } else if (dbType === "neon") {
    const { neon } =
      await importRuntimeModule<typeof import("@neondatabase/serverless")>(
        "@neondatabase/serverless",
      );
    const { drizzle: drizzleNeon } =
      await importRuntimeModule<typeof import("drizzle-orm/neon-http")>(
        "drizzle-orm/neon-http",
      );
    const sql = neon(dbUrl!);
    _db = drizzleNeon(sql, { schema }) as unknown as Record<string, unknown>;
    return;
  } else if (dbType === "libsql") {
    const { createClient } =
      await importRuntimeModule<typeof import("@libsql/client/http")>("@libsql/client/http");
    const { drizzle: drizzleLibsql } =
      await importRuntimeModule<typeof import("drizzle-orm/libsql/http")>(
        "drizzle-orm/libsql/http",
      );
    const client = createClient({
      url: dbUrl!,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    _db = drizzleLibsql(client, { schema }) as unknown as Record<string, unknown>;
    return;
  }

  try {
    const { drizzle: drizzleSqlite } =
      await importRuntimeModule<typeof import("drizzle-orm/better-sqlite3")>(
        "drizzle-orm/better-sqlite3",
      );
    const DatabaseModule = await importRuntimeModule<unknown>("better-sqlite3");
    const Database =
      typeof DatabaseModule === "function"
        ? (DatabaseModule as typeof import("better-sqlite3"))
        : (DatabaseModule as { default: typeof import("better-sqlite3") }).default;
    const sqlite = new Database(dbUrl || "blog.db");
    _sqliteClient = sqlite as unknown as { close?: () => void };
    _db = drizzleSqlite(sqlite, { schema }) as unknown as Record<string, unknown>;
  } catch (error) {
    console.debug(
      'SQLite initialization failed (likely running in environment without better-sqlite3):',
      error,
    );
  }
}

await initializeDb();

export async function reinitializeDbForTesting() {
  try {
    _sqliteClient?.close?.();
  } catch {
    // noop for test-only reinitialization
  }

  _db = null;
  _sqliteClient = null;
  await initializeDb();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new Proxy({} as any, {
  get(_target, prop) {
    const { dbType } = getDatabaseConfig();
    if (prop === "schema") return schema;
    if (_db) return _db[prop as string];

    throw new Error(`Database driver for "${dbType}" not initialized or failed to load.`);
  },
});

export { db, schema };
