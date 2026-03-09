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
export const table: any = isPostgres ? pgTable : sqliteTable

export function text(name: string): any {
  return isPostgres ? pgText(name) : sqliteText(name)
}

export function integer(name: string): any {
  return isPostgres ? pgInteger(name) : sqliteInteger(name)
}

export function boolean(name: string): any {
  return isPostgres 
    ? pgBoolean(name) 
    : (sqliteInteger(name, { mode: 'boolean' }) as any)
}

export function timestamp(name: string): any {
  return isPostgres 
    ? pgTimestamp(name, { mode: 'date' }) 
    : (sqliteInteger(name, { mode: 'timestamp' }) as any)
}

export function autoIncrementId(name: string = 'id'): any {
  return isPostgres 
    ? pgSerial(name).primaryKey() 
    : (sqliteInteger(name).primaryKey({ autoIncrement: true }) as any)
}

export const index: any = isPostgres ? pgIndex : sqliteIndex
export const primaryKey: any = isPostgres ? pgPrimaryKey : sqlitePrimaryKey

export const now = isPostgres ? sql`now()` : sql`(unixepoch())`
