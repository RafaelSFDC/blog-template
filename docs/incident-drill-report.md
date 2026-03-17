# Incident Drill Report (SEV-1 + Rollback)

## Execution

- Date: 2026-03-17
- Scope: SQLite-only operational drill for incident response and rollback.
- Evidence: `artifacts/prod-readiness/phase-08/incident-drill-metrics.json`

## Drill Steps

1. Simulated SEV-1 scenario through readiness-critical validation path (`tests/integration/health.integration.test.ts`).
2. Performed rollback switch to previously validated SQLite snapshot:
   - source: `artifacts/prod-readiness/phase-04/20260317-121140/sqlite-backup.db`
3. Ran smoke validation after rollback (`pnpm test:smoke`).
4. Restored pre-drill active database snapshot.
5. Re-ran smoke validation on restored state.

## Measured Times

- SEV-1 simulation validation: `4613.72 ms`
- Rollback DB switch: `27.85 ms`
- Rollback smoke validation: `30289.15 ms`
- Restore DB switch: `20.99 ms`
- Restore smoke validation: `33911.90 ms`

## Outcome

- Rollback path succeeded.
- Post-rollback and post-restore smoke validations were green.
- Operational procedure is executable without infrastructure changes (SQLite-only).

## Follow-up

- Keep pre-release snapshot creation mandatory.
- Keep smoke validation mandatory after any rollback or emergency restore.
