import { config } from "dotenv";
import { seedOperationalFixtures } from "../tests/fixtures/seed-fixtures";

config({ path: [".env.local", ".env"], override: true });

async function main() {
  const result = await seedOperationalFixtures();
  console.log(JSON.stringify({
    event: "seed-fixtures-complete",
    fixtureUsers: result.users,
    passwordHint: result.password,
  }));
}

main().catch((error) => {
  console.error("Fixture seed failed:", error);
  process.exit(1);
});
