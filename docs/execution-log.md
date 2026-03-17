# R1 Execution Log

## 2026-03-17 - Batch 1

### Scope

- Phase 00 governance baseline.
- Phase 01 SEO routing integrity.
- Phase 02 listing deduplication.
- Phase 03 newsletter webhook security hardening.
- Phase 06 route/test hygiene (newsletter click test relocation).

### Changes

- Added governance docs:
  - `docs/mvp-contract.md`
  - `docs/phase-dod.md`
  - `docs/architecture-map.md`
- Added deterministic CI workflow with lockfile install and quality gates.
- Pinned previously floating TanStack dependencies in `package.json` and added `typecheck` script.
- Fixed canonical route IDs to `/rss.xml` and `/sitemap.xml`.
- Added legacy redirects from `/rss/xml` and `/sitemap/xml`.
- Refactored public listing/archive queries to avoid duplicate posts caused by category joins.
- Hardened newsletter webhook with Svix header verification, signature validation, timestamp window, and replay guard logging.
- Moved newsletter click test out of `src/routes` into integration tests.
- Added integration tests for SEO routes, webhook signature verification, and listing deduplication.

### Validation Checklist

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`

### Notes

- SEO endpoint convention was standardized to framework-compatible routes: `/rss/xml` and `/sitemap/xml`.
- Remaining roadmap phases (04, 05, 07-12) are pending in sequence.

## 2026-03-17 - Batch 2

### Scope

- Phase 04 project-structure migration (`src/server/actions`).
- Phase 05 type-safety hardening for DB/runtime scope.
- Regression stabilization for editorial/media/moderation integrations created for upcoming phases.

### Changes

- Centralized all `*-actions.ts` modules under `src/server/actions/**` by domain.
- Added compatibility re-export shims in legacy `src/server/*-actions.ts` paths.
- Added structural guard script:
  - `scripts/check-actions-location.ts`
  - Wired into `pnpm lint` as `check:actions-location`.
- Completed DB/runtime type hardening:
  - Removed scoped `any` usage from `src/db/dialect.ts`, `src/db/index.ts`, `src/db/schema.ts`.
  - Tightened auth/session typing contracts with explicit app auth types.
- Fixed workflow/runtime regressions surfaced by strict typing:
  - Newsletter form segment narrowing and optional date handling.
  - Dashboard/editor preview typing alignment.
  - Setup starter content typing fixes.
- Added/adjusted integration tests:
  - `tests/integration/editorial-lifecycle.integration.test.ts`
  - `tests/integration/media-cleanup.integration.test.ts`
  - `tests/integration/comment-moderation-audit.integration.test.ts`
- Reworked async SQLite transaction hotspots (better-sqlite3 limitation):
  - `src/server/actions/content/post-actions.ts`
  - `src/server/editorial-workflows.ts`

### Validation Checklist

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm build`

### Notes

- Build emits non-blocking Vite warnings from third-party `"use client"` directives in dependencies.
- Roadmap phases 04 and 05 are now closed; phases 07-12 remain open in strict sequence.
