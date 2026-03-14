# Operacao E Ambiente

## Requisitos

- Node.js 20+
- pnpm
- opcionalmente Wrangler para validar runtime Cloudflare

## Setup Local

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar ambiente

Use `.env.example` como base para `.env.local` ou `.env`.

Variaveis centrais:

- `DB_TYPE`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- chaves do PostHog
- segredos do Stripe
- credenciais opcionais de R2

## Modos De Banco

O projeto suporta quatro modos principais.

### `sqlite`

Uso:

- desenvolvimento local padrao

Comportamento:

- arquivo local, normalmente `blog.db`
- driver `better-sqlite3`

### `d1`

Uso:

- Cloudflare Workers
- validacao com Wrangler local

Comportamento:

- binding `DB`
- configurado em `wrangler.jsonc`

### `neon`

Uso:

- Postgres serverless

Comportamento:

- `@neondatabase/serverless`
- schema ajustado por `src/db/dialect.ts`

### `libsql`

Uso:

- Turso/LibSQL

Comportamento:

- cliente HTTP via `@libsql/client`

## Migrations E Seed

Comandos principais:

```bash
pnpm db:migrate
pnpm db:migrate:prod
pnpm db:generate
pnpm db:push
pnpm db:pull
pnpm db:studio
pnpm seed
pnpm seed:cf
```

Observacao:

- `seed.ts` popula usuarios, categorias, tags, posts e settings iniciais

## Storage Local Vs R2

### Modo local

Quando nao ha binding `STORAGE` nem configuracao R2 remota:

- uploads vao para `public/uploads`

### Modo R2 binding

Quando a app roda em Worker com binding:

- storage usa `STORAGE`

### Modo API remota

Quando ha credenciais S3 compativeis:

- storage usa endpoint R2 Cloudflare via AWS SDK

## Comandos Principais

```bash
pnpm dev
pnpm dev:cf
pnpm dev:cf:scheduled
pnpm build
pnpm preview
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm deploy
```

## Desenvolvimento Com Cloudflare

### Runtime local

```bash
pnpm dev:cf
```

Uso:

- validar bindings D1/R2
- testar comportamento mais proximo do Worker

### Scheduled local

```bash
pnpm dev:cf:scheduled
```

Depois:

```text
http://localhost:3000/__scheduled
```

## Deploy

Fluxo padrao:

```bash
pnpm deploy
```

Esse comando hoje executa:

1. `pnpm run db:migrate:prod`
2. `pnpm run build`
3. `wrangler deploy`

Arquivo central:

- `wrangler.jsonc`

## Cron E Publicacao Agendada

Configuracao atual:

- cron a cada 5 minutos

Execucao:

- handler `scheduled` em `src/server-entry.ts`
- regra de negocio em `publishScheduledPosts`

Fallback:

- `/api/cron/publish`

## Observabilidade E Recuperacao

Estado atual:

- ha logs basicos em alguns fluxos
- Cloudflare observability esta habilitado no config
- nao ha documentacao forte de backup e restauracao
- nao ha trilha formal de auditoria
- nao ha playbook de incidente ou rollback documentado neste repositorio

Politica atual:

- documentar explicitamente essas lacunas
- nao assumir cobertura operacional que o projeto ainda nao tem

## Baseline De Qualidade Antes De Merge

Checks minimos esperados no estado atual:

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test`

Observacao:

- `worker-configuration.d.ts` ainda pode emitir warnings de lint por ser artefato gerado
