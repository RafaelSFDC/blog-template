import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const useExistingServer = Boolean(externalBaseUrl || process.env.PLAYWRIGHT_USE_EXISTING_SERVER);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: externalBaseUrl || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  globalSetup: useExistingServer ? undefined : "./tests/e2e/global-setup.ts",
  webServer: useExistingServer
    ? undefined
    : {
        command: "node .output/server/index.mjs",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
