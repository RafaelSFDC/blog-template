import {
  sqliteTable,
  text as sqliteText,
  integer as sqliteInteger,
  index as sqliteIndex,
  primaryKey as sqlitePrimaryKey,
} from "drizzle-orm/sqlite-core";
import {
  pgTable,
  text as pgText,
  integer as pgInteger,
  boolean as pgBoolean,
  timestamp as pgTimestamp,
  serial as pgSerial,
  index as pgIndex,
  primaryKey as pgPrimaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const dbType = process.env.DB_TYPE || "sqlite";

export const isPostgres = dbType === "neon";

type SqliteTextColumn = ReturnType<typeof sqliteText>
type PgTextColumn = ReturnType<typeof pgText>
type SqliteIntegerColumn = ReturnType<typeof sqliteInteger>
type PgIntegerColumn = ReturnType<typeof pgInteger>
type PgBooleanColumn = ReturnType<typeof pgBoolean>
type PgTimestampColumn = ReturnType<typeof pgTimestamp>
type PgSerialColumn = ReturnType<typeof pgSerial>
type UnsafeAny = ReturnType<typeof JSON.parse>;

function castColumn<T>(value: unknown): T {
  return value as T;
}

// Compatibility layer while schema unification is still in progress.
export const table: UnsafeAny = isPostgres ? pgTable : sqliteTable;

export function text(name: string): SqliteTextColumn | PgTextColumn {
  return isPostgres ? pgText(name) : sqliteText(name);
}

export function integer(name: string): SqliteIntegerColumn | PgIntegerColumn {
  return isPostgres ? pgInteger(name) : sqliteInteger(name);
}

export function boolean(name: string): PgBooleanColumn {
  return isPostgres
    ? pgBoolean(name)
    : castColumn<PgBooleanColumn>(sqliteInteger(name, { mode: "boolean" }));
}

export function timestamp(name: string): SqliteIntegerColumn | PgTimestampColumn {
  return isPostgres
    ? pgTimestamp(name, { mode: "date" })
    : castColumn<PgTimestampColumn>(sqliteInteger(name, { mode: "timestamp" }));
}

export function autoIncrementId(name: string = "id"): SqliteIntegerColumn | PgSerialColumn {
  return isPostgres
    ? pgSerial(name).primaryKey()
    : castColumn<PgSerialColumn>(sqliteInteger(name).primaryKey({ autoIncrement: true }));
}

export const index: UnsafeAny = isPostgres ? pgIndex : sqliteIndex;
export const primaryKey: UnsafeAny = isPostgres ? pgPrimaryKey : sqlitePrimaryKey;

export const now = isPostgres ? sql`now()` : sql`(unixepoch())`;
