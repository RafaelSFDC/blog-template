import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin as adminPlugin } from 'better-auth/plugins'
import { db } from '../db/index'
import * as schema from '../db/schema'
import { ac, reader, author, editor, moderator, admin, superAdmin } from './permissions'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  plugins: [
    tanstackStartCookies(),
    adminPlugin({
      ac,
      roles: {
        reader,
        author,
        editor,
        moderator,
        admin,
        superAdmin,
      },
    }),
  ],
})
