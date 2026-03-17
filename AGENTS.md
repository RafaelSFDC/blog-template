# Project Guidelines

## Organization

- Reusable hooks must live in `src/hooks`.
- All server-only code must live in `src/server`.
- Server actions must live in `src/server/actions`.
- All schemas must live in `src/schemas` unless they are specific to a component or function.
- All types must live in `src/types` unless they are specific to a component or function.
- Shared helpers that do not belong to hooks or server code should live in `src/lib` or `src/utils`.

## Runtime Rules

- Never test Cloudflare-specific behavior in the test or local development environments.
- Local development and tests must use SQLite only.
- R2 must be simulated locally by saving uploaded files inside a project folder instead of relying on a real Cloudflare bucket.
- Do not add or use any server-side dependency that is not compatible with the Cloudflare runtime.

## Practical Expectations

- If a feature needs persistence in development, prefer SQLite.
- If a feature needs file storage in development, write to a local folder inside the repository.
- Keep Cloudflare integration limited to production-ready boundaries, without making local development depend on Cloudflare services.

## Roadmap Execution Rule

- Every task must be executed against exactly one roadmap.
- The roadmap must always be detailed end-to-end, in the exact execution order, with a checklist for every step.
- No step may be skipped, left implicit, or partially completed.
- Each step must be completed 100% before moving to the next one.
- Checklist items must always be marked as completed as execution progresses.
- Work must continue until the roadmap is fully completed and nothing required by it is left undone.

## Type Safety Rules

- Never create generic types unless they are truly 100% exclusive to a single use case and cannot be represented by the existing source model.
- All types and schemas must follow exactly one source of truth, with no parallel definitions, drift, or derived copies that can become inconsistent over time.
- `any` is forbidden.
- Workarounds, shortcuts, and temporary hacks are forbidden when they introduce technical debt or weaken correctness.
- When a schema or type already exists, reuse it directly instead of recreating, reshaping, or loosely mirroring it elsewhere.
