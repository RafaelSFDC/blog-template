import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";
import { getBinding } from "#/server/system/cf-env";

type RuntimeDbClient = BetterSQLite3Database<typeof schema> | DrizzleD1Database<typeof schema>;
type DbClient = BaseSQLiteDatabase<"sync" | "async", unknown, typeof schema>;
type SqliteClientLike = { close?: () => void };
type BetterSqlite3Constructor = typeof import("better-sqlite3");

let sqliteClient: SqliteClientLike | null = null;

function getDatabaseConfig() {
  return {
    dbUrl: process.env.DATABASE_URL,
  };
}

async function importRuntimeModule<TModule>(specifier: string): Promise<TModule> {
  return import(/* @vite-ignore */ specifier) as Promise<TModule>;
}

function resolveBetterSqlite3Constructor(importedModule: unknown): BetterSqlite3Constructor {
  if (typeof importedModule === "function") {
    return importedModule as BetterSqlite3Constructor;
  }

  if (
    typeof importedModule === "object" &&
    importedModule !== null &&
    "default" in importedModule
  ) {
    const candidate = (importedModule as { default: unknown }).default;
    if (typeof candidate === "function") {
      return candidate as BetterSqlite3Constructor;
    }
  }

  throw new Error("Could not resolve better-sqlite3 constructor.");
}

function isProductionLikeEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const runtime = env.ENVIRONMENT || env.NODE_ENV || "development";
  return runtime === "production" || runtime === "staging";
}

async function initializeDb(): Promise<DbClient> {
  const { dbUrl } = getDatabaseConfig();

  if (isProductionLikeEnvironment()) {
    const d1Binding = getBinding<D1Database>("DB");
    if (d1Binding) {
      const { drizzle: drizzleD1 } =
        await importRuntimeModule<typeof import("drizzle-orm/d1")>("drizzle-orm/d1");
      return drizzleD1(d1Binding, { schema }) as RuntimeDbClient;
    }

    throw new Error('Production-like environment requires Cloudflare D1 binding "DB".');
  }

  try {
    const { drizzle: drizzleSqlite } =
      await importRuntimeModule<typeof import("drizzle-orm/better-sqlite3")>(
        "drizzle-orm/better-sqlite3",
      );
    const BetterSqlite3Import = await importRuntimeModule<unknown>("better-sqlite3");
    const BetterSqlite3 = resolveBetterSqlite3Constructor(BetterSqlite3Import);
    const sqlite = new BetterSqlite3(dbUrl || "blog.db");
    sqliteClient = sqlite;

    return drizzleSqlite(sqlite, { schema }) as RuntimeDbClient;
  } catch (error) {
    throw new Error("SQLite initialization failed for local/test runtime.", {
      cause: error,
    });
  }
}

export let db: DbClient = await initializeDb();

export async function reinitializeDbForTesting() {
  try {
    sqliteClient?.close?.();
  } catch {
    // noop for test-only reinitialization
  }

  sqliteClient = null;
  db = await initializeDb();
}

export { schema };
