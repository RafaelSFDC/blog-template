type SmokeTarget = {
  path: string;
  expectedStatus?: number;
  description: string;
};

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const targets: SmokeTarget[] = [
  { path: "/", description: "public homepage" },
  { path: "/blog", description: "blog listing" },
  { path: "/pricing", description: "pricing page" },
  { path: "/auth/login", description: "login page" },
  { path: "/dashboard", expectedStatus: 200, description: "dashboard redirect/auth flow" },
  { path: "/api/health", description: "liveness endpoint" },
  { path: "/api/health/readiness", description: "readiness endpoint" },
];

async function main() {
  const failures: string[] = [];

  for (const target of targets) {
    const response = await fetch(`${baseUrl}${target.path}`, {
      redirect: "follow",
    });

    if (!response.ok) {
      failures.push(`${target.description} returned ${response.status}`);
      continue;
    }

    if (target.expectedStatus && response.status !== target.expectedStatus) {
      failures.push(
        `${target.description} returned ${response.status} instead of ${target.expectedStatus}`,
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(`Smoke check failed:\n${failures.join("\n")}`);
  }

  console.log(
    JSON.stringify({
      event: "smoke-check-passed",
      baseUrl,
      checkedPaths: targets.map((target) => target.path),
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
