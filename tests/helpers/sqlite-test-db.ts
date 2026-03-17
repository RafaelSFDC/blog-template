import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

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

export function createTempDatabasePath(name: string) {
  return path.join(os.tmpdir(), `lumina-${name}-${Date.now()}.sqlite`);
}

export function applySqliteMigrations(dbPath: string) {
  const db = new Database(dbPath);
  const migrationsDir = path.resolve("drizzle");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      try {
        db.exec(`${statement};`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (!isIgnorableMigrationError(message)) {
          db.close();
          throw error;
        }
      }
    }
  }

  db.close();
}

async function removeFileWithRetries(filePath: string, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      fs.rmSync(filePath, { force: true });
      return;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code !== "EBUSY" || attempt === attempts - 1) {
        if (code === "EBUSY") {
          return;
        }

        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

export async function withIsolatedDatabase<T>(
  name: string,
  run: (dbPath: string) => Promise<T>,
) {
  const previousType = process.env.DB_TYPE;
  const previousUrl = process.env.DATABASE_URL;
  const dbPath = createTempDatabasePath(name);

  applySqliteMigrations(dbPath);
  process.env.DB_TYPE = "sqlite";
  process.env.DATABASE_URL = dbPath;

  const { reinitializeDbForTesting } = await import("#/db/index");
  await reinitializeDbForTesting();

  try {
    return await run(dbPath);
  } finally {
    if (previousType === undefined) {
      Reflect.deleteProperty(process.env, "DB_TYPE");
    } else {
      process.env.DB_TYPE = previousType;
    }
    if (previousUrl === undefined) {
      Reflect.deleteProperty(process.env, "DATABASE_URL");
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
    await reinitializeDbForTesting();
    await removeFileWithRetries(dbPath);
  }
}
