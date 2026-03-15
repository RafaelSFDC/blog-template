import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const dbType = process.env.DB_TYPE || "sqlite";
const isProd = process.argv.includes("--prod");
const databaseUrl = process.env.DATABASE_URL || "blog.db";

console.log(`🚀 Starting automigration for: ${dbType}${isProd ? " (Production)" : ""}`);

function isIgnorableMigrationError(message: string) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate column name") ||
    message.includes("duplicate key")
  );
}

function splitSqlStatements(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

function runSqliteMigrations(dbPath: string) {
  const db = new Database(dbPath);
  const migrationsDir = path.resolve("drizzle");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS __lumina_migrations (
      filename TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);

  const applied = new Set(
    db
      .prepare("SELECT filename FROM __lumina_migrations")
      .all()
      .map((row) => String((row as { filename: string }).filename)),
  );

  if (applied.size === 0) {
    const existingTables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__lumina_migrations'",
      )
      .all();

    if (existingTables.length > 0 && migrationFiles.length > 1) {
      const baselineFiles = migrationFiles.slice(0, -1);
      const baseline = db.transaction(() => {
        for (const filename of baselineFiles) {
          db.prepare(
            "INSERT OR REPLACE INTO __lumina_migrations (filename, applied_at) VALUES (?, ?)",
          ).run(filename, Date.now());
        }
      });
      baseline();
      baselineFiles.forEach((filename) => applied.add(filename));
      console.log(`Baselined ${baselineFiles.length} existing migrations for local SQLite.`);
    }
  }

  for (const filename of migrationFiles) {
    if (applied.has(filename)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    const statements = splitSqlStatements(sql);

    const transaction = db.transaction(() => {
      for (const statement of statements) {
        try {
          db.exec(`${statement};`);
        } catch (error) {
          const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
          if (!isIgnorableMigrationError(message)) {
            throw error;
          }
        }
      }

      db.prepare(
        "INSERT OR REPLACE INTO __lumina_migrations (filename, applied_at) VALUES (?, ?)",
      ).run(filename, Date.now());
    });

    transaction();
    console.log(`Applied migration: ${filename}`);
  }

  db.close();
}

try {
  switch (dbType) {
    case "d1": {
      const d1Command = isProd
        ? "npx wrangler d1 migrations apply blog-db --remote"
        : "npx wrangler d1 migrations apply blog-db --local";
      console.log(`Running: ${d1Command}`);
      execSync(d1Command, { stdio: "inherit" });
      break;
    }

    case "sqlite": {
      console.log(`Running local SQL migrations against: ${databaseUrl}`);
      runSqliteMigrations(databaseUrl);
      break;
    }

    case "libsql":
    case "neon": {
      const drizzleCommand = "npx drizzle-kit push";
      console.log(`Running: ${drizzleCommand}`);
      execSync(drizzleCommand, { stdio: "inherit" });
      break;
    }

    default:
      console.error(`❌ Unknown DB_TYPE: ${dbType}`);
      process.exit(1);
  }
  console.log("✅ Migration completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}
