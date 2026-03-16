import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const useExistingServer = Boolean(externalBaseUrl || process.env.PLAYWRIGHT_USE_EXISTING_SERVER);
const localBaseUrl = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: externalBaseUrl || localBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  globalSetup: useExistingServer ? undefined : "./tests/e2e/global-setup.ts",
  webServer: useExistingServer
    ? undefined
    : {
        command: "pnpm exec vite dev --host 127.0.0.1 --port 3100",
        url: localBaseUrl,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          PORT: "3100",
          BETTER_AUTH_SECRET:
            process.env.BETTER_AUTH_SECRET || "playwright-better-auth-secret",
          BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || localBaseUrl,
        },
      },
});
