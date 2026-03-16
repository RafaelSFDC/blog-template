import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const database = getArg("--database") || "blog-db";
const targetEnv = getArg("--env");
const outputFlag = getArg("--output");
const useLocal = process.argv.includes("--local");
const outputDir = path.resolve("backups");
const output =
  outputFlag ||
  path.join(outputDir, `${database}-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`);

fs.mkdirSync(path.dirname(output), { recursive: true });

const args = ["exec", "wrangler", "d1", "export", database];
if (targetEnv) {
  args.push("--env", targetEnv);
}
args.push(useLocal ? "--local" : "--remote", "--output", output);

execFileSync("pnpm", args, {
  stdio: "inherit",
  cwd: path.resolve("."),
});
