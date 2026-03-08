import { config } from 'dotenv'
import { faker } from '@faker-js/faker'

config({ path: ['.env.local', '.env'], override: true })

async function seed() {
  const { db } = await import('./src/db/index')
  const { posts } = await import('./src/db/schema')

  console.log('Seeding blog posts...')
  
  const samplePosts = Array.from({ length: 5 }).map(() => {
    const title = faker.lorem.sentence()
    return {
      title,
      slug: faker.helpers.slugify(title).toLowerCase(),
      excerpt: faker.lorem.paragraph(),
      content: `# ${title}\n\n${faker.lorem.paragraphs(3)}\n\n## Section 1\n\n${faker.lorem.paragraphs(2)}\n\n> ${faker.lorem.sentence()}\n\n${faker.lorem.paragraphs(2)}`,
      publishedAt: new Date(faker.date.recent({ days: 30 })),
    }
  })

  await db.insert(posts).values(samplePosts).onConflictDoNothing()
  
  console.log('Seed completed successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
