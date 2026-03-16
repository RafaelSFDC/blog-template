import { execFileSync } from "node:child_process";
import path from "node:path";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const database = getArg("--database") || "blog-db";
const timestamp = getArg("--timestamp");
const bookmark = getArg("--bookmark");
const targetEnv = getArg("--env");

if (!timestamp && !bookmark) {
  throw new Error("Provide either --timestamp <rfc3339> or --bookmark <bookmark>.");
}

const args = ["exec", "wrangler", "d1", "time-travel", "restore", database];
if (targetEnv) {
  args.push("--env", targetEnv);
}

if (timestamp) {
  args.push("--timestamp", timestamp);
}

if (bookmark) {
  args.push("--bookmark", bookmark);
}

execFileSync("pnpm", args, {
  stdio: "inherit",
  cwd: path.resolve("."),
});
