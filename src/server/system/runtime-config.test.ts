import { afterEach, describe, expect, it } from "vitest";
import {
  getRuntimeEnvironment,
  isStrictEnvironment,
  resolveExternalBaseUrl,
  resolveNewsletterTokenSecret,
  resolveStripeSecretKey,
} from "#/server/system/runtime-config";

const ORIGINAL_ENV = { ...process.env };

function withEnv(
  updates: Partial<NodeJS.ProcessEnv>,
  run: () => void,
) {
  const touched = new Set(Object.keys(updates));

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const key of touched) {
      const originalValue = ORIGINAL_ENV[key];
      if (originalValue === undefined) {
        Reflect.deleteProperty(process.env, key);
      } else {
        process.env[key] = originalValue;
      }
    }
  }
}

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      Reflect.deleteProperty(process.env, key);
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }
});

describe("runtime-config", () => {
  it("detects strict environments from ENVIRONMENT/NODE_ENV", () => {
    withEnv({ ENVIRONMENT: "production" }, () => {
      expect(getRuntimeEnvironment()).toBe("production");
      expect(isStrictEnvironment()).toBe(true);
    });

    withEnv({ ENVIRONMENT: "staging" }, () => {
      expect(isStrictEnvironment()).toBe(true);
    });

    withEnv({ ENVIRONMENT: undefined, NODE_ENV: "development" }, () => {
      expect(isStrictEnvironment()).toBe(false);
    });
  });

  it("requires explicit base url in strict environments", () => {
    withEnv({ ENVIRONMENT: "staging", APP_URL: undefined }, () => {
      expect(() =>
        resolveExternalBaseUrl({
          envVarName: "APP_URL",
        }),
      ).toThrow(/APP_URL is required/i);
    });
  });

  it("allows dev fallback url in non-strict environments", () => {
    withEnv({ ENVIRONMENT: undefined, NODE_ENV: "development", APP_URL: undefined }, () => {
      expect(
        resolveExternalBaseUrl({
          envVarName: "APP_URL",
        }),
      ).toBe("http://localhost:3000");
    });
  });

  it("requires newsletter secret in strict environments", () => {
    withEnv(
      {
        ENVIRONMENT: "production",
        NEWSLETTER_TOKEN_SECRET: "",
        BETTER_AUTH_SECRET: "",
        AUTH_SECRET: "",
      },
      () => {
        expect(() => resolveNewsletterTokenSecret()).toThrow(/NEWSLETTER_TOKEN_SECRET/i);
      },
    );
  });

  it("uses development newsletter secret fallback outside strict environments", () => {
    withEnv(
      {
        ENVIRONMENT: undefined,
        NODE_ENV: "development",
        NEWSLETTER_TOKEN_SECRET: "",
        BETTER_AUTH_SECRET: "",
        AUTH_SECRET: "",
      },
      () => {
        expect(resolveNewsletterTokenSecret()).toBe("dev-newsletter-token-secret");
      },
    );
  });

  it("requires stripe secret in strict environments and falls back in development", () => {
    withEnv({ ENVIRONMENT: "production", STRIPE_SECRET_KEY: "" }, () => {
      expect(() => resolveStripeSecretKey()).toThrow(/STRIPE_SECRET_KEY is required/i);
    });

    withEnv(
      { ENVIRONMENT: undefined, NODE_ENV: "test", STRIPE_SECRET_KEY: "" },
      () => {
        expect(resolveStripeSecretKey()).toBe("sk_test_dev_only_do_not_use");
      },
    );
  });
});

