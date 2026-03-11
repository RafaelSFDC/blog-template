import { 
  sqliteTable, 
  text as sqliteText, 
  integer as sqliteInteger, 
  index as sqliteIndex,
  primaryKey as sqlitePrimaryKey
} from 'drizzle-orm/sqlite-core'
import { 
  pgTable, 
  text as pgText, 
  integer as pgInteger, 
  boolean as pgBoolean, 
  timestamp as pgTimestamp, 
  serial as pgSerial, 
  index as pgIndex,
  primaryKey as pgPrimaryKey
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const dbType = process.env.DB_TYPE || 'sqlite'

export const isPostgres = dbType === 'neon'

// Types for better IDE support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const table: any = isPostgres ? pgTable : sqliteTable

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function text(name: string): any {
  return isPostgres ? pgText(name) : sqliteText(name)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function integer(name: string): any {
  return isPostgres ? pgInteger(name) : sqliteInteger(name)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function boolean(name: string): any {
  return isPostgres 
    ? pgBoolean(name) 
    : (sqliteInteger(name, { mode: 'boolean' }) as unknown as ReturnType<typeof pgBoolean>)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timestamp(name: string): any {
  return isPostgres 
    ? pgTimestamp(name, { mode: 'date' }) 
    : (sqliteInteger(name, { mode: 'timestamp' }) as unknown as ReturnType<typeof pgTimestamp>)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function autoIncrementId(name: string = 'id'): any {
  return isPostgres 
    ? pgSerial(name).primaryKey() 
    : (sqliteInteger(name).primaryKey({ autoIncrement: true }) as unknown as ReturnType<typeof pgSerial>)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const index: any = isPostgres ? pgIndex : sqliteIndex
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const primaryKey: any = isPostgres ? pgPrimaryKey : sqlitePrimaryKey

export const now = isPostgres ? sql`now()` : sql`(unixepoch())`
