
const REGISTRATION_LOCK_KEY = 'registration_locked'

export async function isRegistrationLocked() {
  const { db } = await import('#/db/index')
  const { appSettings } = await import('#/db/schema')
  const { eq } = await import('drizzle-orm')

  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, REGISTRATION_LOCK_KEY),
  })

  return row?.value === '1'
}

export async function lockRegistration() {
  const { db } = await import('#/db/index')
  const { appSettings } = await import('#/db/schema')

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
