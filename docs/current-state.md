# Current State

## Plataforma
- Frontend: React + TanStack Start.
- Persistencia local/testes: SQLite.
- Persistencia de producao: Cloudflare D1.
- Storage local/testes: `public/uploads`.
- Storage de producao: binding `STORAGE` (R2).

## Organizacao de Codigo
- Banco server-only em `src/server/db`.
- Server actions em `src/server/actions`.
- Schemas compartilhados em `src/schemas`.
- Tipos compartilhados em `src/types`.
