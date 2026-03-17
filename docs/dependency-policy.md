# Dependency Policy (Deterministic SQLite-Only Runtime)

## Determinism Rules

- Lockfile is mandatory and treated as source of truth.
- `latest`, floating nightly tags, and unpinned aliases are not allowed.
- Critical toolchain dependencies must be pinned to explicit versions.

## Update Window

- Dependency updates happen in controlled windows only.
- Each update window must:
  1. update lockfile
  2. run full gates (`lint`, `typecheck`, `test`, `build`)
  3. record risks and rollback note in `docs/execution-log.md`

## Allowed Versioning Strategy

- Stable libraries: semver ranges are allowed only when lockfile is committed.
- Nightly/experimental packages: explicit version only (no floating channel).

## Emergency Rollback Rule

- If regressions are detected after update, rollback to previous approved RC tag and matching lockfile.
