# Definition of Done (DoD) by Phase

## Global DoD (applies to every phase)

- All planned checklist items for the phase are completed.
- Code compiles and typechecks without introducing new warnings/errors.
- Tests for impacted behavior are present and passing.
- `docs/execution-log.md` contains what changed, validation commands, and outcomes.
- `docs/roadmap.md` checklist is updated in-place.

## Phase-specific closure criteria

- Phase 00: governance artifacts exist and CI deterministic gates are defined.
- Phase 01: canonical SEO routes + legacy compatibility are implemented and tested.
- Phase 02: listing/pagination duplication bug fixed and covered by integration tests.
- Phase 03: webhook signature validation, replay guard, and invalid-request rejection are active and tested.
- Phase 04: server actions are centralized under `src/server/actions` with compatibility plan.
- Phase 05: explicit `any` in critical runtime boundaries reduced and strict typecheck gate enforced.
- Phase 06: no test files inside `src/routes`; route generation noise eliminated.
- Phase 07-12: close only with functional evidence + regression coverage + operational docs updated.
