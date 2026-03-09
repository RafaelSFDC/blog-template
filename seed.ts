import { config } from 'dotenv'
import { faker } from '@faker-js/faker'

config({ path: ['.env.local', '.env'], override: true })

async function seed() {
  const { db } = await import('./src/db/index')
  const { posts, appSettings } = await import('./src/db/schema')

  console.log('Seeding blog posts...')
  
  const categories = ['Design', 'Development', 'Product', 'Culture', 'AI']
  const samplePosts = Array.from({ length: 12 }).map(() => {
    const title = faker.lorem.sentence()
    return {
      title,
      slug: faker.helpers.slugify(title).toLowerCase(),
      excerpt: faker.lorem.paragraph(),
      content: `# ${title}\n\n${faker.lorem.paragraphs(3)}\n\n## Section 1\n\n${faker.lorem.paragraphs(2)}\n\n> ${faker.lorem.sentence()}\n\n${faker.lorem.paragraphs(2)}`,
      coverImage: `https://picsum.photos/seed/${faker.string.uuid()}/1200/675`,
      category: faker.helpers.arrayElement(categories),
      tags: faker.lorem.words(3).split(' ').join(','),
      readingTime: faker.number.int({ min: 3, max: 15 }),
      publishedAt: new Date(faker.date.recent({ days: 30 })),
    }
  })

  await db.insert(posts).values(samplePosts).onConflictDoNothing()

  console.log('Seeding app settings...')
  const initialSettings = [
    { key: 'blogName', value: 'VibeZine' },
    { key: 'accentColor', value: '#ff5c00' },
    { key: 'fontFamily', value: 'Inter' },
    { key: 'gaMeasurementId', value: '' },
    { key: 'plausibleDomain', value: '' },
  ]
  await db.insert(appSettings).values(initialSettings).onConflictDoNothing()
  
  console.log('Seed completed successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
