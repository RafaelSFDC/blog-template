import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export default async function globalSetup() {
  const cwd = path.resolve(".");
  const env = {
    ...process.env,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "playwright-better-auth-secret",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://127.0.0.1:3100",
  };

  fs.rmSync(path.join(cwd, ".output"), { recursive: true, force: true });
  fs.rmSync(path.join(cwd, ".tanstack", "tmp"), { recursive: true, force: true });

  execSync("pnpm db:migrate", {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32" ? "cmd.exe" : undefined,
  });
  execSync("pnpm seed:fixtures", {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32" ? "cmd.exe" : undefined,
  });
}
