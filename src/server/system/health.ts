import { db } from "#/db/index";
import { getSecurityConfigAudit } from "#/server/security/config";
import { getBinding } from "#/server/system/cf-env";

type StorageProbe = {
  head: (key: string) => Promise<unknown>;
};

type QueueProbe = {
  send: (message: unknown) => Promise<void>;
};

type HealthStatus = "ok" | "degraded" | "failed";
type HealthCheckName = "database" | "storage" | "queue" | "security_config";

type HealthCheckResult = {
  name: HealthCheckName;
  status: HealthStatus;
  message: string;
  details?: Record<string, unknown>;
};

type ReadinessDeps = {
  database?: typeof db;
  storage?: StorageProbe | null;
  queue?: QueueProbe | null;
  env?: NodeJS.ProcessEnv;
};

function getRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env) {
  return env.ENVIRONMENT || env.NODE_ENV || "development";
}

function deriveOverallStatus(checks: HealthCheckResult[]) {
  if (checks.some((check) => check.status === "failed")) {
    return "failed" as const;
  }

  if (checks.some((check) => check.status === "degraded")) {
    return "degraded" as const;
  }

  return "ok" as const;
}

async function checkDatabase(database: typeof db): Promise<HealthCheckResult> {
  try {
    await database.query.appSettings.findFirst({
      columns: {
        key: true,
      },
    });
    return {
      name: "database",
      status: "ok",
      message: "Database connection is healthy.",
    };
  } catch (error) {
    return {
      name: "database",
      status: "failed",
      message: "Database readiness check failed.",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function checkStorage(storage: StorageProbe | null | undefined): Promise<HealthCheckResult> {
  if (!storage) {
    return {
      name: "storage",
      status: "failed",
      message: "Storage binding is missing.",
    };
  }

  try {
    await storage.head("__lumina_health__");
    return {
      name: "storage",
      status: "ok",
      message: "Storage binding is reachable.",
    };
  } catch (error) {
    return {
      name: "storage",
      status: "failed",
      message: "Storage readiness check failed.",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function checkQueue(queue: QueueProbe | null | undefined): HealthCheckResult {
  if (!queue) {
    return {
      name: "queue",
      status: "failed",
      message: "Newsletter queue binding is missing.",
    };
  }

  return {
    name: "queue",
    status: "ok",
    message: "Newsletter queue binding is configured.",
  };
}

function checkSecurityConfig(env: NodeJS.ProcessEnv): HealthCheckResult {
  const audit = getSecurityConfigAudit(env);
  const environment = getRuntimeEnvironment(env);

  if (environment === "production" && audit.missingRequired.length > 0) {
    return {
      name: "security_config",
      status: "failed",
      message: "Required security configuration is missing in production.",
      details: {
        missingRequired: audit.missingRequired,
      },
    };
  }

  if (audit.missingRequired.length > 0 || audit.optionalWarnings.length > 0) {
    return {
      name: "security_config",
      status: "degraded",
      message: "Security configuration has warnings.",
      details: {
        missingRequired: audit.missingRequired,
        optionalWarnings: audit.optionalWarnings,
      },
    };
  }

  return {
    name: "security_config",
    status: "ok",
    message: "Security configuration is complete.",
  };
}

export function getLivenessStatus() {
  return {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    service: "lumina",
  };
}

export async function getReadinessStatus(deps: ReadinessDeps = {}) {
  const env = deps.env ?? process.env;
  const checks = await Promise.all([
    checkDatabase(deps.database ?? db),
    checkStorage(
      deps.storage ??
        getBinding<StorageProbe>("STORAGE") ??
        null,
    ),
    Promise.resolve(checkQueue(deps.queue ?? getBinding<QueueProbe>("NEWSLETTER_QUEUE") ?? null)),
    Promise.resolve(checkSecurityConfig(env)),
  ]);

  return {
    status: deriveOverallStatus(checks),
    timestamp: new Date().toISOString(),
    environment: getRuntimeEnvironment(env),
    checks,
  };
}

export async function getDependencyHealthStatus(deps: ReadinessDeps = {}) {
  const readiness = await getReadinessStatus(deps);
  return {
    timestamp: readiness.timestamp,
    environment: readiness.environment,
    checks: readiness.checks,
  };
}
