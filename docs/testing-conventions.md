# Testing Conventions

- Route handler tests must live in `tests/integration`, never inside `src/routes`.
- Unit tests for libraries/components can stay colocated as `*.test.ts(x)` under `src`.
- Integration tests must use `tests/helpers/sqlite-test-db.ts` for isolated SQLite databases.
- New regression tests should be added for every bugfix in routing, security, and data integrity flows.
