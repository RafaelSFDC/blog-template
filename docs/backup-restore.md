# Backup and Restore Runbook (SQLite-Only PROD Readiness)

## Scope

- Runtime target: SQLite only.
- This runbook does not include D1/Worker operations.

## Backup Policy

- Before every release candidate: full SQLite copy backup.
- Before every schema migration: full SQLite copy backup.
- Retention:
  - Last 7 daily backups.
  - Last 4 weekly backups.

## Phase 04 Evidence (2026-03-17)

Source artifacts:
- `artifacts/prod-readiness/phase-04/20260317-121140/metrics.json`
- `artifacts/prod-readiness/phase-04/20260317-121140/restore-validation.json`

Measured results:
- Clean DB migration: `693.87 ms`
- Data DB migration (`blog.db` snapshot): `817.86 ms`
- SQLite backup copy: `41.86 ms`
- SQLite restore copy: `17.02 ms`

Post-restore validation (row counts):
- `posts`: `45`
- `pages`: `4`
- `media`: `1`
- `comments`: `3`
- `subscriptions`: `2`
- `newsletter_deliveries`: `0`
- `contact_messages`: `3`
- `__lumina_migrations`: `14`

## Operational Targets

- Measured `RTO` (technical restore copy): `0.017 s`.
- Operational `RTO` target (restore + restart + health validation): `<= 5 min`.
- Measured `RPO` during drill: `0 s` (file-copy snapshot at stop-the-world point).

## Restore Procedure

1. Pause write operations.
2. Copy active DB file to recovery path (`*.bak`).
3. Replace active DB file with chosen backup snapshot.
4. Restart application process.
5. Validate:
   - `GET /api/health`
   - `GET /api/health/readiness`
   - `GET /api/health/dependencies`
   - public smoke routes (`/`, `/blog`, `/rss/xml`, `/sitemap/xml`)
6. Confirm key row counts and migration ledger (`__lumina_migrations`).

## Known Risk Found in Drill

- Snapshot `sqlite.db` failed migration replay with `no such table: contact_messages`.
- Mitigation:
  - Use `blog.db` as release snapshot source of truth.
  - Require pre-release migration check on candidate snapshot before tagging.
