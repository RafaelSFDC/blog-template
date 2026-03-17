# Lumina MVP Performance Budget

## Scope

This budget defines the minimum acceptable performance for MVP critical public paths.

## Critical Routes

- `/`
- `/blog`
- `/blog/$slug`
- `/rss/xml`
- `/sitemap/xml`

## Budgets (p75, production-like profile)

- `LCP`: <= 2.8s
- `FCP`: <= 1.8s
- `CLS`: <= 0.1
- `TBT`: <= 250ms
- HTML response time (server): <= 450ms for cache-hit public pages

## Payload and Query Budgets

- Initial JS (gzipped): <= 300KB on public pages.
- CSS (gzipped): <= 50KB critical above-the-fold route.
- Blog index query p95 (SQLite local baseline): <= 120ms.
- Post by slug query p95 (SQLite local baseline): <= 90ms.
- Feed/sitemap generation p95 (20 post feed): <= 180ms.

## Validation Method

- Run: `pnpm build` and collect bundle output deltas.
- Run integration suite:
  - `tests/integration/public-listing.integration.test.ts`
  - `tests/integration/seo-routes.integration.test.ts`
- Manual spot checks in local/staging for route TTFB and CWV traces.

## Alert Thresholds (Operational)

- Warning:
  - route p95 server time > budget by 20%.
  - bundle size delta > 10% from release baseline.
- Critical:
  - route p95 server time > budget by 40%.
  - LCP p75 > 3.5s on critical routes.
