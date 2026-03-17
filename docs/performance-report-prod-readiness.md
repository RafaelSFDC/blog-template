# Performance Report - PROD Readiness (SQLite-Only)

## Execution Date

- 2026-03-17

## Evidence Sources

- `artifacts/prod-readiness/phase-06/public-route-baseline.json`
- `artifacts/prod-readiness/phase-06/editorial-load-baseline.json`
- `docs/performance-budget.md`

## Public Route Baseline (Playwright request profile)

Sample size: `10` requests per route.

- `/`
  - p50: `32.55 ms`
  - p95: `47.46 ms`
- `/blog`
  - p50: `39.75 ms`
  - p95: `89.30 ms`
- `/blog/fixture-premium-post`
  - p50: `43.47 ms`
  - p95: `176.32 ms`
- `/rss/xml`
  - p50: `11.78 ms`
  - p95: `15.22 ms`
- `/sitemap/xml`
  - p50: `12.10 ms`
  - p95: `13.42 ms`

## Editorial Load Baseline

Scenario: `tests/integration/editorial-lifecycle.integration.test.ts` executed `5` times.

- avg: `3513.98 ms`
- p95: `3606.77 ms`
- min/max: `3450.41 / 3606.77 ms`

## Budget Validation

Against `docs/performance-budget.md`:

- Public server response budget (`<= 450 ms`) for critical routes: `PASS`.
- Feed/sitemap generation budget p95 (`<= 180 ms`): `PASS`.
- Blog and post listing/query p95 targets: `PASS` on measured route profile.

## Notes

- Measurements were performed in local SQLite-only mode, with seeded fixture data.
- This is a baseline for go-live readiness and post-go-live drift tracking (24h/72h checks).
