import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/server");
const ACTIONS_ROOT = path.join(ROOT, "actions");

const LEGACY_SHIMS = new Set([
  "analytics-actions.ts",
  "author-profile-actions.ts",
  "comment-actions.ts",
  "invitation-actions.ts",
  "media-actions.ts",
  "membership-actions.ts",
  "menu-actions.ts",
  "newsletter-actions.ts",
  "page-actions.ts",
  "post-actions.ts",
  "redirect-actions.ts",
  "seo-actions.ts",
  "setup-actions.ts",
  "taxonomy-actions.ts",
]);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    const stats = statSync(entryPath);
    if (stats.isDirectory()) {
      files.push(...walk(entryPath));
      continue;
    }
    files.push(entryPath);
  }

  return files;
}

function isInsideActions(filePath: string) {
  const normalized = path.normalize(filePath);
  return normalized.startsWith(path.normalize(ACTIONS_ROOT + path.sep));
}

function isLegacyShim(filePath: string) {
  const name = path.basename(filePath);
  if (!LEGACY_SHIMS.has(name)) return false;

  const source = readFileSync(filePath, "utf8").trim();
  return source.startsWith("export * from \"./actions/");
}

const actionFiles = walk(ROOT).filter((filePath) => filePath.endsWith("-actions.ts"));
const invalid = actionFiles.filter(
  (filePath) => !isInsideActions(filePath) && !isLegacyShim(filePath),
);

if (invalid.length > 0) {
  const lines = invalid
    .map((filePath) => ` - ${path.relative(process.cwd(), filePath).replace(/\\/g, "/")}`)
    .join("\n");
  console.error(
    "Found server action modules outside src/server/actions that are not approved compatibility shims:\n" +
      lines,
  );
  process.exit(1);
}

console.log("Action location guard passed.");
