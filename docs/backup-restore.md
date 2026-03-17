# SQLite to D1 Backup and Restore (MVP)

## Backup Policy

- Local dev/test: SQLite file backup before schema-affecting changes.
- Staging/production: scheduled D1 export snapshots plus pre-release checkpoint.
- Retention:
  - daily backups for 7 days
  - weekly backups for 4 weeks

## SQLite Backup (Local)

1. Stop write-heavy processes.
2. Copy DB file (`DATABASE_URL` target) to timestamped backup path.
3. Verify file checksum and openability.

## SQLite Restore (Local)

1. Stop app processes.
2. Replace active DB file with selected backup.
3. Start app and run:
   - `pnpm typecheck`
   - `pnpm test`
   - smoke checks (`/api/health/readiness`, `/blog`)

## D1 Restore Path (Operational)

1. Identify snapshot and restore window.
2. Restore D1 dataset using platform export/import workflow.
3. Validate schema version and key tables:
   - `posts`, `pages`, `media`, `comments`, `subscriptions`, `newsletter_deliveries`
4. Run readiness endpoint and publish incident update.

## Validation Checklist

- Row counts within expected tolerance for critical tables.
- Editorial read/write flow operational.
- Feed/sitemap endpoints return valid XML.
- No critical security config warnings.
