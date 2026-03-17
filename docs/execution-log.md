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
