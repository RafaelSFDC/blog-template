# Lumina MVP Roadmap (WordPress-like Blog)

## Scope and Objective

This roadmap defines the single execution plan for shipping the Lumina MVP as a WordPress-like blog platform. It consolidates:

- Deep technical diagnosis of the current repository.
- Full backlog of remaining work.
- Ordered execution sequence with explicit checklists.
- Exit criteria for each phase.

Execution rule: each phase must be completed 100% before the next phase starts.

## Current Technical Diagnosis

### Strengths (already implemented)

- Strong domain model in D1/SQLite with posts, pages, taxonomies, comments, memberships, newsletters, and setup entities.
- Public + dashboard route architecture already in place.
- Local-first SQLite development is active and aligned with runtime constraints.
- Security primitives exist (rate limit, Turnstile integration points, auditing tables).
- Test suite foundation exists (unit/integration/smoke scaffolding).

### Critical Problems Found

1. `P0` SEO route mismatch:
   - Current route registration resolves to `/rss/xml` and `/sitemap/xml`.
   - Product/docs expectation is `/rss.xml` and `/sitemap.xml`.
   - Impact: crawler compatibility risk and broken canonical endpoints.

2. `P0` Newsletter webhook authenticity gap:
   - Webhook endpoint processes payloads without robust signature verification.
   - Impact: spoofed event injection and security incident risk.

3. `P0` Potential duplicate posts in public listing:
   - Join strategy with categories can duplicate rows for multi-category posts.
   - Impact: incorrect pagination, duplicate cards, unstable listing behavior.

4. `P1` Architectural rule violation:
   - Server actions are not centralized in `src/server/actions` as required by project rules.
   - Impact: maintainability and governance drift.

5. `P1` Type-safety policy violations:
   - Forbidden `any` usage still present in core database/runtime typing paths.
   - Impact: weak compile-time guarantees in critical boundaries.

6. `P1` Test file inside route tree:
   - Route generator sees test files under `src/routes`, causing warnings and noisy build output.
   - Impact: reduced CI signal quality and route generation friction.

7. `P1` Reproducibility risk from broad `latest` dependency usage:
   - Impact: nondeterministic updates and harder rollback/debugging.

8. `P1` Documentation drift:
   - Referenced strategic docs were missing/outdated in repository state.
   - Impact: roadmap execution and onboarding friction.

9. `P2` High-complexity monolithic service files:
   - Very large server modules concentrate too many responsibilities.
   - Impact: regression risk and slower change velocity.

10. `P2` Coverage imbalance:
    - Core flows exist, but high-risk paths (security/webhook/edge-case listing) need stronger contract tests.

## Single Ordered Roadmap

### Phase 00 - Governance Baseline (Foundation)

Objective: establish deterministic delivery and shared execution criteria.

- [x] Define MVP acceptance contract (functional + non-functional) in docs.
- [x] Freeze dependency policy (replace broad `latest` usage for critical packages).
- [x] Enforce deterministic install/build policy in CI.
- [x] Publish architecture map (runtime boundaries, data flow, route ownership).
- [x] Approve Definition of Done (DoD) per phase.

Exit criteria:

- MVP acceptance contract documented and approved.
- CI bootstrap deterministic and reproducible.

---

### Phase 01 - SEO Routing and Discovery Integrity

Objective: fix canonical discovery endpoints and eliminate route ambiguity.

- [x] Standardize canonical endpoints to framework-compatible file-route paths: `/rss/xml` and `/sitemap/xml`.
- [x] Resolve route ambiguity by using one canonical SEO path convention.
- [x] Update all internal references (head links, footer, docs, tests).
- [x] Validate generated XML output correctness and content freshness.
- [x] Add regression tests for canonical route-path alignment.

Exit criteria:

- Canonical URLs resolve correctly with expected XML and headers.
- No conflicting route definitions remain.

---

### Phase 02 - Data Integrity for Public Listings

Objective: guarantee one-row-per-post behavior across public discovery pages.

- [x] Refactor listing queries to avoid duplicates from many-to-many joins.
- [x] Fix total count/pagination semantics for unique post IDs.
- [x] Guarantee deterministic sort order for pagination stability.
- [x] Validate category/tag/date filter combinations.
- [x] Add integration tests for multi-category multi-page datasets.

Exit criteria:

- No duplicate post render in any listing scenario.
- Pagination metadata always matches unique post set.

---

### Phase 03 - Webhook and External Input Security

Objective: harden trust boundaries for newsletter and external callbacks.

- [x] Implement provider signature verification in newsletter webhook.
- [x] Add replay protection (timestamp window + idempotency/event tracking).
- [x] Define reject-and-log policy for invalid signatures.
- [x] Add abuse-rate controls specific to webhook endpoint.
- [x] Add contract tests for valid/invalid/replayed webhook events.

Exit criteria:

- Unauthenticated webhook payloads are rejected consistently.
- Audit trail is complete for accepted and rejected events.

---

### Phase 04 - Project Structure Compliance

Objective: enforce repository architectural rules without functional regressions.

- [x] Create/normalize `src/server/actions` as the single action boundary.
- [x] Migrate existing action modules into the required structure.
- [x] Update imports and route handlers to new action locations.
- [x] Add lint/validation guard to prevent future placement drift.
- [x] Verify no behavior change through regression tests.

Exit criteria:

- 100% of server actions reside in `src/server/actions`.
- Automated checks fail on structure violations.

---

### Phase 05 - Type-Safety Hardening

Objective: remove unsafe typing from critical runtime layers.

- [x] Remove forbidden `any` usage in database/runtime paths.
- [x] Replace `ts-ignore`/`ts-expect-error` where avoidable with typed contracts.
- [x] Consolidate schemas/types as single source of truth.
- [x] Add strict typecheck gate to CI (`tsc --noEmit`).
- [x] Add typing regression tests for key action payload contracts.

Exit criteria:

- Type policy rules are met and enforced automatically.
- Core actions compile with strict safety guarantees.

---

### Phase 06 - Route Tree and Test Hygiene

Objective: separate execution code from test artifacts in routing boundaries.

- [x] Move route-adjacent tests out of `src/routes` scan path.
- [x] Adopt and document one test placement convention.
- [x] Silence route generator warnings by structure, not suppression.
- [x] Ensure test discovery still includes migrated files.
- [x] Confirm clean route generation in local + CI builds.

Exit criteria:

- Route generation has zero test-file contamination warnings.
- Test organization follows one enforced convention.

---

### Phase 07 - Editorial MVP Completion

Objective: finalize must-have blog CMS behavior for authors/editors.

- [ ] Validate full post lifecycle: draft -> review -> publish -> update.
- [ ] Validate page lifecycle and permalink behavior.
- [ ] Ensure revision history + restore flow is reliable.
- [ ] Confirm slug uniqueness and collision handling.
- [ ] Add missing UX/system feedback for failed editorial actions.

Exit criteria:

- Editorial team can manage posts/pages end-to-end without manual DB intervention.

---

### Phase 08 - Media and Asset Pipeline (Local-first + Production-boundary)

Objective: stabilize upload, metadata, and local simulation behavior.

- [ ] Validate local media persistence in repository folder (no Cloudflare coupling in dev).
- [ ] Enforce upload validation (mime/type/size/security checks).
- [ ] Ensure metadata model supports alt/title/caption and rendering.
- [ ] Implement orphan cleanup policy and safe deletion flow.
- [ ] Add integration tests for upload, retrieval, and deletion.

Exit criteria:

- Media pipeline works reliably in local SQLite-based development.
- Production storage boundary remains isolated and swappable.

---

### Phase 09 - Comments, Moderation, and Anti-Abuse MVP

Objective: ship public interaction safely.

- [ ] Validate public comment submission and moderation state machine.
- [ ] Enforce anti-spam/abuse controls per IP/session/fingerprint strategy.
- [ ] Ensure moderation panel supports approve/reject/remove workflows.
- [ ] Add audit logging for moderation actions.
- [ ] Add tests for abuse scenarios and moderation regressions.

Exit criteria:

- Commenting is usable and abuse-resistant for MVP scale.

---

### Phase 10 - SEO, Performance, and Content Discoverability

Objective: make content indexable, fast, and stable under expected load.

- [ ] Review canonical/meta strategy per page type.
- [ ] Ensure robots and indexing directives are coherent by environment.
- [ ] Optimize high-traffic listing/search queries (indexes + query plans).
- [ ] Establish MVP performance budget for primary routes.
- [ ] Add regression checks for sitemap/feed freshness and metadata.

Exit criteria:

- Key routes meet agreed performance budget and SEO baseline.

---

### Phase 11 - Observability and Operations Readiness

Objective: prepare for controlled production rollout and incident response.

- [ ] Standardize structured logging for critical flows.
- [ ] Finalize health endpoints for DB, queue/jobs, and external integrations.
- [ ] Document incident triage + rollback runbook.
- [ ] Validate backup/restore process for SQLite/D1 migration path.
- [ ] Define alerting thresholds for MVP launch.

Exit criteria:

- Team can detect, diagnose, and recover from critical failures quickly.

---

### Phase 12 - Release Qualification and Go-Live

Objective: execute final quality gate and launch with rollback safety.

- [ ] Run full pipeline: lint, strict typecheck, unit, integration, smoke/e2e.
- [ ] Execute business acceptance checklist against MVP contract.
- [ ] Freeze release candidate and verify migration scripts.
- [ ] Perform controlled rollout rehearsal (including rollback drill).
- [ ] Publish final launch report with residual risks and mitigations.

Exit criteria:

- MVP approved for production with tested rollback path.

## Risk Register (MVP Delivery)

- `High` Security incident risk if webhook authenticity remains unresolved.
- `High` SEO discoverability loss if canonical feed/sitemap routes remain mismatched.
- `High` Data trust risk if listing duplicates affect pagination/archives.
- `Medium` Velocity loss if monolithic files remain unrefactored.
- `Medium` Regression risk if type policy and architecture rules are not enforced by CI.

## Execution Tracking Rules

- Only this roadmap is active for MVP execution.
- No phase may run in parallel with a later phase.
- Every checklist item must be explicitly marked complete before advancing.
- Any newly discovered blocker must be appended to this file in the relevant phase before continuing.
