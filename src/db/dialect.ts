import {
  index as sqliteIndex,
  integer as sqliteInteger,
  primaryKey as sqlitePrimaryKey,
  sqliteTable,
  text as sqliteText,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const isPostgres = false;

export const table = sqliteTable;
export const text = sqliteText;
export const integer = sqliteInteger;
export const index = sqliteIndex;
export const primaryKey = sqlitePrimaryKey;

export function boolean(name: string) {
  return sqliteInteger(name, { mode: "boolean" });
}

export function timestamp(name: string) {
  return sqliteInteger(name, { mode: "timestamp" });
}

export function autoIncrementId(name = "id") {
  return sqliteInteger(name).primaryKey({ autoIncrement: true });
}

export const now = sql`(unixepoch())`;
