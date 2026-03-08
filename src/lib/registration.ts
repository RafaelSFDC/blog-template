import { db } from '#/db/index'
import { appSettings, users } from '#/db/schema'
import { eq } from 'drizzle-orm'

const REGISTRATION_LOCK_KEY = 'registration_locked'

export async function isRegistrationLocked() {
  const [row, existingUser] = await Promise.all([
    db.query.appSettings.findFirst({
      where: eq(appSettings.key, REGISTRATION_LOCK_KEY),
    }),
    db.query.users.findFirst({
      columns: { id: true },
    }),
  ])

  return row?.value === '1' || Boolean(existingUser)
}

export async function lockRegistration() {
  await db
    .insert(appSettings)
    .values({
      key: REGISTRATION_LOCK_KEY,
      value: '1',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: '1',
        updatedAt: new Date(),
      },
    })
}
