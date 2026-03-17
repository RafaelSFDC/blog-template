# Architecture Map (MVP)

## Runtime Boundaries

- `src/routes`: HTTP route entrypoints (public, dashboard, API).
- `src/server`: server domain logic, actions, security, integrations.
- `src/db`: schema, dialect, runtime database bootstrap.
- `src/lib`: cross-cutting helpers (seo, pagination, security-safe utilities).
- `tests/integration`: integration scenarios running on isolated SQLite databases.

## Data Flow (high-level)

- Route -> server function/action -> Drizzle ORM -> SQLite/D1 runtime binding.
- Public SEO endpoints (`rss.xml`, `sitemap.xml`) derive data from published records and site settings.
- Newsletter webhook route validates signature and replay guard before dispatching to campaign processing.

## Ownership Boundaries

- SEO and discovery: `src/routes/rss.xml.ts`, `src/routes/sitemap.xml.ts`, `src/server/public/*`.
- Newsletter security and campaign lifecycle: `src/routes/api/newsletter/*`, `src/server/newsletter-*`.
- Security controls and telemetry: `src/server/security/*`.
- Persistence contracts: `src/db/schema.ts`.

## Environment Rules

- Local and tests: SQLite only.
- Cloudflare-specific behavior: production boundary only; local simulation for storage/services.
- No server-side dependency incompatible with Cloudflare runtime may be introduced.
