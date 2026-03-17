# Release Policy (SQLite-Only Production Readiness)

## Branch Baseline

- Operational branch: `main` (single local delivery branch).
- New release work is integrated directly in `main` with quality gates.

## Release Candidate Versioning

- Local release candidate format: `vYYYY.MM.DD-rcN`.
- Examples:
  - `v2026.03.17-rc1`
  - `v2026.03.17-rc2`

## Local Changelog Convention

- Each release candidate must append one dated section in `docs/execution-log.md` with:
  - scope covered
  - user-visible changes
  - risks introduced/resolved
  - gate results (`lint`, `typecheck`, `test`, `build`)

## Rollback by Approved Version

- Rollback target is always the previous approved RC tag.
- Rollback sequence:
  1. Checkout previous approved RC tag commit.
  2. Restore SQLite backup taken before current rollout.
  3. Run smoke checks and health endpoints.
  4. Re-open traffic only after readiness is green.

## Exit Criteria for Release

- All mandatory gates pass.
- Incident/rollback playbook is up to date.
- Previous RC tag is preserved as immediate fallback.
