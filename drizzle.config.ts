import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'] })

const dbType = process.env.DB_TYPE || 'sqlite'

const credentials: any = {
  url: process.env.DATABASE_URL || 'blog.db',
}

if (dbType === 'libsql') {
  credentials.authToken = process.env.DATABASE_AUTH_TOKEN
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: dbType === 'neon' ? 'postgresql' : 'sqlite',
  dbCredentials: credentials,
})


