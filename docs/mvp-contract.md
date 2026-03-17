# MVP Contract - Lumina Blog

## Functional Acceptance

- Public blog index with pagination and search must return stable, deduplicated post listings.
- Post pages, category pages, tag pages, and archive pages must resolve published content consistently.
- RSS and sitemap must be available at canonical endpoints: `/rss.xml` and `/sitemap.xml`.
- Newsletter subscribe/confirm/unsubscribe must work in local SQLite mode without cloud-only runtime dependencies.
- Newsletter click and webhook flows must validate inputs and reject malformed requests.
- Dashboard content operations (create, update, publish) must remain functional for posts/pages.

## Non-Functional Acceptance

- Local development and test runtime must use SQLite.
- Build, lint, typecheck, and tests must run deterministically from lockfile state.
- No route generator warnings caused by test files inside route tree.
- Webhook endpoint must enforce authenticity and replay protection.
- Critical flows must have integration coverage for regression protection.

## Release Gates

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm test` passes.
- Canonical SEO endpoint checks pass.
- Security contract tests for newsletter webhook pass.
