# Arquitetura Do Lumina

## Visao Geral

O Lumina e uma aplicacao full-stack baseada em **TanStack Start**, com renderizacao server-side, rotas file-based, server functions para casos de uso do CMS e um target de deploy orientado a **Cloudflare Workers**.

Hoje o projeto combina quatro blocos principais:

- site publico
- dashboard administrativo
- endpoints HTTP em `src/routes/api`
- camada de dominio e integracoes em `src/server`, `src/lib` e `src/db`

## Runtime E Entrypoints

### Desenvolvimento local

No fluxo padrao, a aplicacao roda com Vite:

- comando: `pnpm dev`
- porta: `3000`
- entrypoint de app: TanStack Start + `src/router.tsx`
- configuracao de bundling: `vite.config.ts`

Nesse modo, o projeto pode usar:

- SQLite local via `better-sqlite3`
- uploads locais em `public/uploads`
- proxy de ingest do PostHog em `/api/ingest`

### Runtime Cloudflare

Em ambiente Worker, o entrypoint principal e:

- `src/server-entry.ts`

Esse arquivo exporta:

- `fetch`, criado via `createStartHandler(defaultStreamHandler)`
- `scheduled`, usado para publicar posts agendados

Configuracao de deploy:

- `wrangler.jsonc`
- binding D1: `DB`
- binding R2: `STORAGE`
- cron trigger: a cada 5 minutos

## Fronteiras De Responsabilidade

### `src/routes`

Responsavel por:

- definir rotas publicas
- definir rotas administrativas
- expor endpoints HTTP em `api`
- montar loaders e pages do TanStack Router

Nao deve concentrar regra de negocio profunda. A rota pode coordenar o fluxo, mas a logica principal deve viver em `src/server` ou em helpers puros de `src/lib`.

### `src/server`

Responsavel por:

- regras de negocio do CMS
- server functions reutilizaveis
- fluxos de persistencia
- integracoes orientadas a casos de uso

Exemplos:

- `post-actions.ts`
- `page-actions.ts`
- `taxonomy-actions.ts`
- `newsletter-actions.ts`
- `analytics-actions.ts`

Este diretorio e a camada preferencial para comportamento de dominio.

### `src/lib`

Responsavel por:

- utilitarios puros
- schemas Zod
- helpers de auth e permissions
- helpers de CMS, SEO, storage e webhooks
- funcoes de apoio reutilizaveis entre rotas, server actions e componentes

Regra pratica:

- se a funcao representa um caso de uso do sistema, ela tende a pertencer a `src/server`
- se a funcao e infrastructural, validacao, formatacao ou helper compartilhado, ela tende a pertencer a `src/lib`

### `src/components`

Responsavel por UI reutilizavel, separada por contexto:

- `ui`: biblioteca base de componentes
- `dashboard`: UI administrativa
- `blog`: componentes da area publica editorial
- `cms`: edicao e renderizacao de conteudo CMS
- `analytics`, `auth`, `tiptap`: subdominios especificos

### `src/db`

Responsavel por:

- schema principal do banco
- abstracao entre dialetos
- bootstrap do Drizzle por ambiente

Arquivos centrais:

- `schema.ts`
- `dialect.ts`
- `index.ts`

## App Shell E Dados Globais

O root route em `src/routes/__root.tsx` centraliza:

- carga de configuracoes globais do site
- `ThemeProvider`
- provider do TanStack Query
- provider lazy do PostHog
- metadados base, favicon, RSS e sitemap

As configuracoes globais sao montadas principalmente via `src/lib/cms.ts`, lendo `app_settings`, menus e links sociais.

## Estrategia Editorial Por Entidade

O Lumina usa duas ferramentas editoriais com papeis diferentes e complementares:

- `Tiptap`: editor principal de escrita para posts e conteudo textual editorial
- `Puck`: page builder principal para paginas institucionais, landing pages e composicoes estruturadas

Essas ferramentas nao competem entre si no produto. A divisao desejada e:

- post = escrita editorial com Tiptap
- pagina = composicao estrutural com Puck

Observacao importante sobre o estado atual:

- o codigo ainda preserva compatibilidade com conteudo textual serializado em paginas
- isso deve ser tratado como compatibilidade de implementacao, nao como ambiguidade de produto

## Persistencia E Modos De Banco

O projeto suporta multiplos modos de banco via `DB_TYPE`:

- `sqlite`
- `d1`
- `neon`
- `libsql`

Escolha do driver:

- feita em runtime por `src/db/index.ts`

Abstracao do schema:

- feita em `src/db/dialect.ts`

Persistencia principal:

- Drizzle ORM sobre schema tipado em `src/db/schema.ts`

## Storage De Midia

O modulo de storage em `src/lib/storage.ts` suporta tres modos:

- `binding`: usa o binding R2 do Worker
- `remote-api`: usa API S3 compativel do R2
- `local`: escreve em `public/uploads`

Isso permite que o mesmo fluxo de media funcione:

- em dev local sem Cloudflare
- em validacao local com Wrangler
- em producao com R2

## Integracoes Externas

### Better Auth

Responsavel por:

- email/senha
- reset de senha
- provedores sociais
- papeis e acesso administrativo

Arquivos centrais:

- `src/lib/auth.ts`
- `src/lib/admin-auth.ts`
- `src/lib/permissions.ts`

### PostHog

Responsavel por:

- tracking client-side
- analytics agregadas no dashboard
- eventos ligados a assinatura

Arquivos centrais:

- `src/components/analytics/*`
- `src/server/posthog.ts`
- `src/server/analytics-actions.ts`

### Stripe

Responsavel por:

- criar checkout de assinatura
- atualizar status de assinatura por webhook

Arquivos centrais:

- `src/server/stripe.ts`
- `src/routes/api/stripe/checkout.ts`
- `src/routes/api/stripe/webhook.ts`

### Resend

Responsavel principalmente por emails de suporte a auth, como reset de senha, e tambem pela base para envios futuros.

Arquivo central:

- `src/lib/resend.ts`

### Cloudflare

Responsavel por:

- runtime de producao
- D1
- R2
- cron triggers

Arquivos centrais:

- `wrangler.jsonc`
- `src/server-entry.ts`
- `src/lib/cf-env.ts`

## Estado Atual E Ambiguidades Relevantes

A arquitetura ja e suficiente para um CMS editorial funcional, mas ha pontos ainda nao consolidados e que devem ser tratados como tal:

- algumas camadas ainda preservam compatibilidade tecnica com mais de um formato de conteudo em paginas
- codigo experimental misturado a codigo principal
- sobreposicao parcial entre responsabilidades de `src/server` e `src/lib`
- documentacao operacional ainda parcial antes deste pacote

O objetivo desta documentacao e reduzir exatamente essas zonas cinzentas.
