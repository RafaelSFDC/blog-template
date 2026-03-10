import { config } from "dotenv";
import { faker } from "@faker-js/faker";

config({ path: [".env.local", ".env"], override: true });

async function seed() {
  const { db } = await import("./src/db/index");
  const {
    user,
    posts,
    categories,
    tags,
    postCategories,
    postTags,
    appSettings,
  } = await import("./src/db/schema");

  console.log("--- Reseting Data (Optional/Manual) ---");
  // We use onConflictDoNothing in inserts, but if we want a fresh start we could truncate.
  // For now, we'll keep it additive or idempotent.

  console.log("--- Seeding Users ---");
  const sampleUsers = Array.from({ length: 5 }).map((_, i) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    role: i === 0 ? "admin" : faker.helpers.arrayElement(["author", "reader"]),
    image: faker.image.avatar(),
    emailVerified: true,
  }));

  await db.insert(user).values(sampleUsers).onConflictDoNothing();
  const allUsers = (await db.select().from(user)) as any[];
  const authors = allUsers.filter(
    (u: any) => u.role === "admin" || u.role === "author",
  );

  console.log("--- Seeding Categories ---");
  const categoryNames = [
    "Design",
    "Development",
    "Product",
    "Culture",
    "AI",
    "Lifestyle",
    "Travel",
  ];
  const sampleCategories = categoryNames.map((name) => ({
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
    description: faker.lorem.sentence(),
  }));

  for (const cat of sampleCategories) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  const allCategories = (await db.select().from(categories)) as any[];

  console.log("--- Seeding Tags ---");
  const tagNames = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Tailwind",
    "Drizzle",
    "SQLite",
    "Cloudflare",
  ];
  const sampleTags = tagNames.map((name) => ({
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
  }));

  for (const tag of sampleTags) {
    await db.insert(tags).values(tag).onConflictDoNothing();
  }
  const allTags = (await db.select().from(tags)) as any[];

  console.log("--- Seeding Posts ---");
  const postCount = 20;
  for (let i = 0; i < postCount; i++) {
    const title = faker.lorem.sentence();
    const author = faker.helpers.arrayElement(authors);

    const postResult = await db
      .insert(posts)
      .values({
        title,
        slug:
          faker.helpers.slugify(title).toLowerCase() +
          "-" +
          faker.string.alphanumeric(5),
        excerpt: faker.lorem.paragraph(),
        content: `# ${title}\n\n${faker.lorem.paragraphs(3)}\n\n## Section 1\n\n${faker.lorem.paragraphs(2)}\n\n> ${faker.lorem.sentence()}\n\n${faker.lorem.paragraphs(2)}`,
        coverImage: `https://picsum.photos/seed/${faker.string.uuid()}/1200/675`,
        status: "published",
        readingTime: faker.number.int({ min: 3, max: 15 }),
        authorId: author.id,
        publishedAt: new Date(faker.date.recent({ days: 30 })),
      })
      .onConflictDoNothing()
      .returning();

    if (postResult.length > 0) {
      const insertedPost = postResult[0];

      // Associate with random categories
      const selectedCats = faker.helpers.arrayElements(allCategories, {
        min: 1,
        max: 2,
      });
      for (const cat of selectedCats) {
        await db
          .insert(postCategories)
          .values({
            postId: insertedPost.id,
            categoryId: cat.id,
          })
          .onConflictDoNothing();
      }

      // Associate with random tags
      const selectedTags = faker.helpers.arrayElements(allTags, {
        min: 2,
        max: 4,
      });
      for (const tag of selectedTags) {
        await db
          .insert(postTags)
          .values({
            postId: insertedPost.id,
            tagId: tag.id,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log("--- Seeding App Settings ---");
  const initialSettings = [
    { key: "blogName", value: "VibeZine" },
    { key: "accentColor", value: "#ff5c00" },
    { key: "fontFamily", value: "Inter" },
    { key: "gaMeasurementId", value: "" },
    { key: "plausibleDomain", value: "" },
  ];
  await db.insert(appSettings).values(initialSettings).onConflictDoNothing();

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
