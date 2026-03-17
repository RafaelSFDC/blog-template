# PR Draft - Sprint 1 (P0) + P1 Kickoff

## Summary

This PR delivers Sprint 1 P0 hardening and starts P1 schema cohesion.

### P0 delivered

- Secure redirect validation for newsletter click tracking endpoint.
- Strict environment config resolution for external URLs and required secrets.
- Stripe secret hardening with fail-fast behavior in `staging/production`.
- Removal of insecure localhost fallbacks in sensitive external flows.
- Full quality gate validated (`lint`, `tsc`, unit and integration tests).

### P1 kickoff delivered

- Beta request types now derive from schema (`z.infer`) as single source of truth.
- Removed duplicated string-union typing between:
  - marketing utilities
  - beta server action
  - beta request form

## Risk Notes

- In strict environments, missing required env vars now fail fast by design.
- Newsletter click endpoint now returns `400` for invalid/unsafe URL targets.

## Validation Evidence

- `pnpm run lint` passed
- `pnpm exec tsc --noEmit` passed
- `pnpm run test:unit` passed
- `pnpm run test:integration` passed

## Follow-ups (next P1 slices)

- Reduce `any` usage in DB core layer (`src/db/index.ts` and `src/db/dialect.ts`).
- Continue schema/type unification for other duplicated domains.

## P1 Fatia 2 Notes (DB Typing Conservative)

- Current compatibility debt intentionally kept:
  - `table`, `index`, `primaryKey` in `src/db/dialect.ts` still use permissive typing.
  - Most index callback blocks in `src/db/schema.ts` still use legacy permissive callback typing.
- Why: these are the primary triggers for Drizzle signature cascades when tightened too early.
- Incremental progress in this slice:
  - Column helpers in `src/db/dialect.ts` moved away from `any` to explicit return unions.
  - Cast pattern centralized via a single safe helper.
  - Local reusable alias introduced in `src/db/schema.ts` and applied to a small subset for validation.
- Planned removal path:
  - Next dedicated slice: migrate callback blocks in small batches.
  - Final slice: type `table/index/primaryKey` with stronger abstractions once schema callbacks are stabilized.
