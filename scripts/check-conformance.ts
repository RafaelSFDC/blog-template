import fs from "node:fs/promises";
import path from "node:path";

type Violation = {
  file: string;
  message: string;
};

const ROOT = process.cwd();
const SCAN_ROOTS = ["src", "tests", "db", "scripts", "README.md", ".env.example", "package.json"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".wrangler",
  ".tanstack",
  ".vinxi",
  "test-results",
]);

function toPosix(relativePath: string) {
  return relativePath.split(path.sep).join("/");
}

function shouldScanFile(filePath: string) {
  const extension = path.extname(filePath);
  return [".ts", ".tsx", ".js", ".mjs", ".cjs", ".md", ".json", ".jsonc", ".example"].includes(extension)
    || path.basename(filePath).startsWith(".env");
}

async function walk(targetPath: string): Promise<string[]> {
  const stat = await fs.stat(targetPath);
  if (stat.isFile()) {
    return shouldScanFile(targetPath) ? [targetPath] : [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectViolations(file: string, content: string): Violation[] {
  const relative = toPosix(path.relative(ROOT, file));
  const violations: Violation[] = [];

  if (relative === "scripts/check-conformance.ts") {
    return violations;
  }

  if (
    relative.startsWith("src/")
    && (relative.endsWith(".ts") || relative.endsWith(".tsx"))
    && content.includes("createServerFn")
    && !relative.startsWith("src/server/actions/")
  ) {
    violations.push({
      file: relative,
      message: "`createServerFn` fora de `src/server/actions`.",
    });
  }

  const patterns: Array<{ regex: RegExp; message: string }> = [
    {
      regex: /#\/db\/(index|schema)/g,
      message: "Import legado de `#/db/*` detectado.",
    },
    {
      regex: /#\/server\/[a-z-]+-actions/g,
      message: "Import legado de actions fora de `#/server/actions/*`.",
    },
    {
      regex: /\bas never\b/g,
      message: "Cast inseguro `as never` detectado.",
    },
    {
      regex: /as unknown as/g,
      message: "Cast inseguro `as unknown as` detectado.",
    },
    {
      regex: /\bDB_TYPE\b/g,
      message: "Referencia a `DB_TYPE` detectada; runtime local deve ser SQLite-only sem seletor de driver.",
    },
    {
      regex: /\bremote-api\b/g,
      message: "Modo de storage remoto legado detectado.",
    },
    {
      regex: /\bR2_ACCESS_KEY_ID\b|\bR2_SECRET_ACCESS_KEY\b|\bR2_ACCOUNT_ID\b|\bR2_BUCKET_NAME\b/g,
      message: "Variavel de storage remoto legado detectada.",
    },
  ];

  for (const { regex, message } of patterns) {
    if (regex.test(content)) {
      violations.push({ file: relative, message });
    }
  }

  return violations;
}

async function main() {
  const files = (
    await Promise.all(
      SCAN_ROOTS
        .map((entry) => path.join(ROOT, entry))
        .map(async (entry) => {
          try {
            return await walk(entry);
          } catch {
            return [];
          }
        }),
    )
  ).flat();

  const violations: Violation[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    violations.push(...collectViolations(file, content));
  }

  if (violations.length > 0) {
    console.error("Conformance check failed:");
    for (const violation of violations) {
      console.error(`- ${violation.file}: ${violation.message}`);
    }
    process.exit(1);
  }

  console.log("Conformance check passed.");
}

void main();
