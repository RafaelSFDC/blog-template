import { test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROUTES = ["/", "/blog", "/blog/fixture-premium-post", "/rss/xml", "/sitemap/xml"] as const;
const SAMPLES = 10;

function percentile(values: number[], pct: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1);
  return Number(sorted[index]!.toFixed(2));
}

test("captures public route baseline for prod-readiness", async ({ request }) => {
  const metrics: Record<string, Record<string, number>> = {};

  for (const route of ROUTES) {
    const samples: number[] = [];
    for (let i = 0; i < SAMPLES; i += 1) {
      const startedAt = performance.now();
      const response = await request.get(route);
      const endedAt = performance.now();
      if (!response.ok()) {
        throw new Error(`Route ${route} returned ${response.status()}`);
      }
      samples.push(endedAt - startedAt);
    }
    const average = samples.reduce((acc, value) => acc + value, 0) / samples.length;
    metrics[route] = {
      samples: samples.length,
      min_ms: Number(Math.min(...samples).toFixed(2)),
      p50_ms: percentile(samples, 50),
      p95_ms: percentile(samples, 95),
      max_ms: Number(Math.max(...samples).toFixed(2)),
      avg_ms: Number(average.toFixed(2)),
    };
  }

  const outputDir = path.resolve("artifacts/prod-readiness/phase-06");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    path.join(outputDir, "public-route-baseline.json"),
    `${JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        sampleSizePerRoute: SAMPLES,
        routes: metrics,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
});
