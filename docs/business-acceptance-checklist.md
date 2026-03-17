# Business Acceptance Checklist (R1 MVP)

## Contract Alignment

- [x] Public blog listing and pagination behave deterministically without duplicate posts.
- [x] Post/page editorial lifecycle supports create, update, revision history, and restore.
- [x] Canonical discovery endpoints are available and validated (`/rss.xml`, `/sitemap.xml` with redirects from legacy paths).
- [x] Comment submission and moderation lifecycle is operational with antiabuse controls.
- [x] Media flow works in local-first mode with validation and safe orphan cleanup.

## Security and Trust

- [x] Newsletter webhook signature verification and replay protection are enforced.
- [x] Comment antiabuse controls (rate limit + spam classification) are active.
- [x] Critical moderation and editorial actions are auditable.

## Operational Readiness

- [x] Structured logs exist for editorial/media/comments/webhook critical flows.
- [x] Health/readiness/dependencies endpoints are available.
- [x] Incident runbook and rollback guidance are documented.
- [x] Backup/restore path for SQLite and D1 is documented and validated in process.
- [x] MVP performance budget and alert thresholds are documented.

## Quality Gates

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm build`
- [x] `pnpm test:smoke`
