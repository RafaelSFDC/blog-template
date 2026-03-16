import { execSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup() {
  const cwd = path.resolve(".");
  execSync("pnpm build", {
    cwd,
    stdio: "inherit",
    shell: true,
  });
  execSync("pnpm db:migrate", {
    cwd,
    stdio: "inherit",
    shell: true,
  });
  execSync("pnpm seed:fixtures", {
    cwd,
    stdio: "inherit",
    shell: true,
  });
}
