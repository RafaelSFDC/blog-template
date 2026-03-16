# Release Checklist

## Pre-release

1. Run `pnpm db:migrate`
2. Run `pnpm test`
3. Run `pnpm test:e2e`
4. Run `pnpm build`
5. Run `pnpm lint`
6. Run `pnpm ops:smoke -- <staging-base-url>` against staging
7. Confirm `/api/health/readiness` returns `ok` or acceptable `degraded`
8. Export a fresh production D1 backup with `pnpm ops:backup:d1`

## Release

1. Confirm the deploy from GitHub completed
2. Re-run smoke checks against production
3. Verify:
   - login
   - dashboard access
   - published post rendering
   - premium paywall
   - newsletter queue health
   - Stripe webhook reachability

## Rollback trigger

Rollback immediately if any of these fail after release:
- `/api/health/readiness` returns `failed`
- auth is unavailable
- published content stops rendering
- Stripe or newsletter webhooks fail repeatedly
- queue backlog grows without recovery
