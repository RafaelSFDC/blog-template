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

