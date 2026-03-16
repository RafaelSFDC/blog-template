import { execFileSync } from "node:child_process";
import path from "node:path";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const file = getArg("--file");
if (!file) {
  throw new Error("Missing required --file <path-to-sql> argument.");
}

const database = getArg("--database") || "blog-db";
const targetEnv = getArg("--env");
const useLocal = process.argv.includes("--local");
const resolvedFile = path.resolve(file);

const args = ["exec", "wrangler", "d1", "execute", database];
if (targetEnv) {
  args.push("--env", targetEnv);
}
args.push(useLocal ? "--local" : "--remote", "--file", resolvedFile, "--yes");

execFileSync("pnpm", args, {
  stdio: "inherit",
  cwd: path.resolve("."),
});
