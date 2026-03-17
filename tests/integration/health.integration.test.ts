import { describe, expect, it } from "vitest";
import { withIsolatedDatabase } from "../helpers/sqlite-test-db";

describe("health integration", () => {
  it("reports readiness when database and bindings are available", async () => {
    await withIsolatedDatabase("health-ready", async () => {
      const { getReadinessStatus } = await import("#/server/system/health");

      const readiness = await getReadinessStatus({
        storage: {
          head: async () => null,
        },
        queue: {
          send: async () => undefined,
        },
        env: {
          ...process.env,
          ENVIRONMENT: "staging",
          TURNSTILE_SITE_KEY: "site",
          TURNSTILE_SECRET_KEY: "secret",
          SECURITY_CONTACT_EMAIL: "ops@example.com",
        },
      });

      expect(readiness.status).toBe("ok");
      expect(readiness.checks.every((check) => check.status === "ok")).toBe(true);
    });
  }, 15000);

  it("fails readiness when critical production security config is missing", async () => {
    await withIsolatedDatabase("health-failed", async () => {
      const { getReadinessStatus } = await import("#/server/system/health");

      const readiness = await getReadinessStatus({
        storage: {
          head: async () => null,
        },
        queue: {
          send: async () => undefined,
        },
        env: {
          ...process.env,
          ENVIRONMENT: "production",
          TURNSTILE_SITE_KEY: "",
          TURNSTILE_SECRET_KEY: "",
          SECURITY_CONTACT_EMAIL: "",
        },
      });

      expect(readiness.status).toBe("failed");
      expect(readiness.checks.find((check) => check.name === "security_config")?.status).toBe(
        "failed",
      );
    });
  }, 15000);
});
