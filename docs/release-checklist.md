# Release Checklist

## Go / no-go rule

Do not release if any of the following is true:

- `pnpm test` fails
- `pnpm test:e2e` fails
- `pnpm build` fails
- `pnpm lint` fails
- readiness returns `failed`
- smoke checks fail on staging
- there is an unresolved auth, publish, checkout, or newsletter incident

## Pre-release

1. Run `pnpm db:migrate`.
2. Run `pnpm test`.
3. Run `pnpm test:e2e`.
4. Run `pnpm build`.
5. Run `pnpm lint`.
6. Run `pnpm ops:smoke -- <staging-base-url>`.
7. Confirm `/api/health/readiness` returns `ok` or an explicitly accepted `degraded`.
8. Export a fresh production D1 backup with `pnpm ops:backup:d1`.
9. Review `/dashboard/beta-ops` for:
   - blocked onboarding accounts
   - high-priority new feedback
   - any account depending on the release

## Release

1. Confirm the deploy from GitHub completed.
2. Re-run smoke checks against production:
   - `pnpm ops:smoke -- <production-base-url>`
3. Verify manually:
   - login
   - dashboard access
   - setup wizard still loads for a fresh admin fixture or equivalent
   - published post rendering
   - premium paywall
   - newsletter queue health
   - Stripe webhook reachability
   - `/dashboard/beta-ops` renders
4. Record any launch-relevant issue in Beta Ops feedback before ending the release window.

## Post-release verification

Check within the release window:

- readiness remains healthy
- no spike in Sentry for auth, billing, publishing, or queue paths
- Stripe and newsletter webhooks continue processing
- no beta accounts moved to `blocked` because of the release

## Rollback triggers

Rollback immediately if any of these fail after release:

- `/api/health/readiness` returns `failed`
- auth is unavailable
- published content stops rendering
- Stripe or newsletter webhooks fail repeatedly
- queue backlog grows without recovery
- setup, dashboard, or Beta Ops surfaces become unavailable for admins

## Rollback steps

1. Stop further release actions and notify stakeholders.
2. Revert to the last known good deployment.
3. Re-run smoke checks against production.
4. If data recovery is needed, follow [docs/restore-drill.md](/Users/Win/Documents/GitHub/lumina/docs/restore-drill.md).
5. Log the incident and follow-up actions in Beta Ops feedback or the operational incident record.
