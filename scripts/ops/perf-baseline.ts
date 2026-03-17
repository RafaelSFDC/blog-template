import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = 4310;
const BASE_URL = `http://${HOST}:${PORT}`;
const ROUTES = ["/", "/blog", "/blog/fixture-premium-post", "/rss/xml", "/sitemap/xml"] as const;
const SAMPLES_PER_ROUTE = 15;

type RouteMetrics = {
  samples: number;
  minMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  averageMs: number;
};

function percentile(values: number[], pct: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index]!;
}

async function waitForServer(url: string, timeoutMs = 45_000) {
  const start = Date.now();
  let lastError: string | null = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Preview server did not start in ${timeoutMs}ms (${lastError ?? "unknown error"})`);
}

async function measureRoute(route: string): Promise<RouteMetrics> {
  const samples: number[] = [];
  for (let index = 0; index < SAMPLES_PER_ROUTE; index += 1) {
    const startedAt = performance.now();
    const response = await fetch(`${BASE_URL}${route}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const endedAt = performance.now();
    if (!response.ok) {
      throw new Error(`Route ${route} returned HTTP ${response.status}`);
    }
    samples.push(Number((endedAt - startedAt).toFixed(2)));
  }

  const minMs = Math.min(...samples);
  const maxMs = Math.max(...samples);
  const averageMs = samples.reduce((acc, value) => acc + value, 0) / samples.length;

  return {
    samples: samples.length,
    minMs: Number(minMs.toFixed(2)),
    p50Ms: Number(percentile(samples, 50).toFixed(2)),
    p95Ms: Number(percentile(samples, 95).toFixed(2)),
    maxMs: Number(maxMs.toFixed(2)),
    averageMs: Number(averageMs.toFixed(2)),
  };
}

async function main() {
  const outputDir = path.resolve("artifacts/prod-readiness/phase-06");
  await mkdir(outputDir, { recursive: true });
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  const preview = spawn(pnpmCommand, ["preview", "--host", HOST, "--port", String(PORT)], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: {
      ...process.env,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "sk_test_prod_readiness_local",
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY ?? "turnstile-secret-local",
      TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY ?? "turnstile-site-local",
    },
  });

  let stdout = "";
  let stderr = "";
  preview.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  preview.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/api/health`);
    const routes = await Promise.all(
      ROUTES.map(async (route) => [route, await measureRoute(route)] as const),
    );
    const payload = {
      timestamp: new Date().toISOString(),
      sampleSizePerRoute: SAMPLES_PER_ROUTE,
      routes: Object.fromEntries(routes),
    };
    await writeFile(
      path.join(outputDir, "public-route-baseline.json"),
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8",
    );
    await writeFile(path.join(outputDir, "preview-server.out.log"), stdout, "utf8");
    await writeFile(path.join(outputDir, "preview-server.err.log"), stderr, "utf8");
    console.log(JSON.stringify(payload, null, 2));
  } finally {
    preview.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
