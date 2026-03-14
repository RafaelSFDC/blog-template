# Lumina

Lumina e um CMS editorial open source em evolucao, construido com **TanStack Start**, **React 19**, **Drizzle ORM** e foco em deploy moderno na **Cloudflare**.

Hoje o projeto ja vai muito alem de um template de blog: ele combina area publica, painel administrativo, modelagem de dados rica, editor de conteudo, SEO, analytics, newsletter, comentarios, media, webhooks e base inicial para monetizacao com Stripe.

## Visao Geral

O objetivo do Lumina e ser um **CMS single-site moderno para publicacoes**, servindo tanto equipes editoriais quanto desenvolvedores que querem uma base tipada, extensivel e pronta para customizacao.

Na pratica, o repositorio atualmente entrega:

- site publico com home, blog, post, categorias, tags, paginas dinamicas, autenticacao, conta e contato
- dashboard administrativo com gestao de posts, paginas, categorias, tags, media, comentarios, usuarios, assinantes, analytics, settings, menus, redirects e webhooks
- fluxo editorial com rascunho, publicacao e agendamento
- SEO tecnico e editorial com metadados globais e por conteudo, `sitemap.xml` e `rss.xml`
- suporte a conteudo premium e integracao inicial com Stripe para assinaturas
- analytics com PostHog
- i18n inicial com Paraglide
- deploy orientado a Cloudflare Workers + D1 + R2

## Estado Atual Do Projeto

O Lumina deve ser entendido hoje como um **CMS editorial em construcao**, nao apenas como um blog starter.

Ja existe base funcional para uso e demonstracao, mas algumas frentes ainda estao em consolidacao, como:

- fluxo editorial avancado
- historico de versoes
- autosave
- maturidade maior em analytics
- automacoes de newsletter
- robustez operacional e testes end-to-end

Os documentos em [`docs/vision.md`](./docs/vision.md), [`docs/current-state.md`](./docs/current-state.md) e [`docs/roadmap.md`](./docs/roadmap.md) detalham essa direcao.

## Principais Funcionalidades

### Area publica

- Home publica com possibilidade de homepage gerenciada pelo CMS
- Listagem de posts com paginacao e busca
- Pagina individual de post
- Paginas por categoria e tag
- Paginas dinamicas publicas por slug
- Paginas de autenticacao
- Pagina de conta
- Pagina de contato
- Feed RSS e sitemap XML

### CMS editorial

- CRUD de posts
- CRUD de paginas
- CRUD de categorias
- CRUD de tags
- Modulo de media com upload e exclusao
- Comentarios nativos com moderacao
- Definicao de homepage por pagina publicada
- Slugs amigaveis e validacoes de conteudo
- Conteudo premium por post
- Publicacao agendada com cron

### Editor e conteudo

- Editor rico com Tiptap
- Pipeline de conteudo em Markdown
- Suporte a headings, links, imagens, alinhamento, underline, highlight, embeds e YouTube
- Componentes CMS para renderizacao de paginas
- Base para preview editorial

### Administracao

- Dashboard com estatisticas resumidas
- Gestao de usuarios e assinantes
- Gestao de menus
- Gestao de redirects
- Gestao de mensagens de contato
- Gestao de webhooks
- Configuracoes globais de branding, SEO e links sociais

### SEO, descoberta e distribuicao

- SEO global e por post/pagina
- `meta title`, `meta description` e Open Graph
- `robots` configuravel
- `sitemap.xml`
- `rss.xml`
- `siteUrl` configuravel

### Audiencia e monetizacao

- Newsletter com cadastro de subscribers
- Exportacao de posts
- Comentarios publicos
- Stripe checkout para assinatura recorrente
- Webhook Stripe para persistir estado de assinatura no usuario

### Plataforma e integracoes

- Autenticacao com Better Auth
- papeis `reader`, `author`, `editor`, `moderator`, `admin` e `superAdmin`
- PostHog para analytics e eventos de produto
- Resend para emails
- Cloudflare D1 para banco em producao
- Cloudflare R2 para armazenamento de media
- fallback local para banco e uploads em desenvolvimento

## Stack Tecnica

### Frontend e app

- React 19
- TanStack Start
- TanStack Router
- TanStack Query
- Tailwind CSS v4
- Base UI / Radix / componentes reutilizaveis
- Tiptap
- Puck Editor

### Backend e dados

- TanStack Start server functions
- Drizzle ORM
- Better Auth
- SQLite local via `better-sqlite3`
- Cloudflare D1
- suporte adicional a Neon e LibSQL/Turso

### Infra e servicos

- Cloudflare Workers
- Cloudflare R2
- Cloudflare Cron Triggers
- PostHog
- Stripe
- Resend
- AWS SDK S3 client para acesso compativel ao R2 via API

### Qualidade e DX

- TypeScript
- ESLint
- Vitest
- React Compiler via Babel plugin
- `vite-tsconfig-paths`

## Arquitetura Geral

O projeto segue uma organizacao full-stack em torno do TanStack Start:

- `src/routes`: rotas file-based publicas, administrativas e de API
- `src/server`: regras de dominio e server actions por modulo
- `src/components`: componentes de UI, blog, dashboard, auth, CMS e analytics
- `src/db`: adaptadores, schema e bootstrap do Drizzle
- `src/lib`: utilitarios, validacoes, auth, SEO, storage, CMS e webhooks
- `src/styles`: temas CSS do produto
- `drizzle`: migrations SQL
- `db`: scripts de migracao em TypeScript
- `docs`: visao, roadmap e estado atual do produto

## Estrutura De Pastas

```text
lumina/
|- docs/                     # visao do produto, estado atual e roadmap
|- db/                       # scripts de migracao
|- drizzle/                  # migrations geradas/aplicadas
|- public/                   # assets estaticos e uploads locais
|- src/
|  |- components/
|  |  |- analytics/          # providers e integracao PostHog
|  |  |- auth/               # login social e componentes de auth
|  |  |- blog/               # cards, newsletter, comentarios, paywall
|  |  |- cms/                # editor/renderizacao de paginas CMS
|  |  |- dashboard/          # layout e componentes do painel
|  |  |- tiptap/             # extensoes e toolbars do editor
|  |  `- ui/                 # biblioteca de componentes reutilizaveis
|  |- db/
|  |  |- dialect.ts          # abstracao entre sqlite e postgres
|  |  |- index.ts            # inicializacao do Drizzle por ambiente
|  |  `- schema.ts           # schema principal do banco
|  |- integrations/
|  |  |- better-auth/
|  |  `- tanstack-query/
|  |- lib/                   # auth, permissoes, SEO, storage, CMS, webhooks
|  |- routes/
|  |  |- _public/            # site publico
|  |  |- api/                # endpoints HTTP
|  |  `- dashboard/          # painel administrativo
|  |- server/                # actions e logica de negocio
|  |- styles/
|  |  `- themes/             # variacoes visuais do projeto
|  |- router.tsx
|  `- server-entry.ts        # entrypoint do Worker e scheduled handler
|- .env.example
|- drizzle.config.ts
|- package.json
|- seed.ts
|- vite.config.ts
`- wrangler.jsonc
```

## Rotas E Modulos Principais

### Publico

- `/`
- `/blog`
- `/blog/$slug`
- `/blog/category/$slug`
- `/blog/tag/$slug`
- `/$slug` para paginas CMS dinamicas
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/account`
- `/contact`
- `/rss.xml`
- `/sitemap.xml`

### Dashboard

- `/dashboard`
- `/dashboard/posts`
- `/dashboard/pages`
- `/dashboard/categories`
- `/dashboard/tags`
- `/dashboard/comments`
- `/dashboard/media`
- `/dashboard/users`
- `/dashboard/users/subscribers`
- `/dashboard/newsletters`
- `/dashboard/analytics`
- `/dashboard/messages`
- `/dashboard/settings`
- `/dashboard/menus`
- `/dashboard/redirects`
- `/dashboard/webhooks`

### API

- `/api/auth/*`
- `/api/comments`
- `/api/comments/$id`
- `/api/media/*`
- `/api/export/posts`
- `/api/newsletter/unsubscribe`
- `/api/stripe/checkout`
- `/api/stripe/webhook`
- `/api/cron/publish`
- `/api/ingest/*`

## Modelo De Dados

O schema principal em `src/db/schema.ts` cobre:

- usuarios, sessoes, contas e verificacoes
- categorias e tags
- media
- posts
- paginas
- comentarios
- relacoes `postCategories` e `postTags`
- configuracoes globais em `app_settings`
- menus e itens de menu
- subscribers
- newsletters e logs de envio
- mensagens de contato
- webhooks e historico de entregas
- redirects
- visitantes e page views
- campos de assinatura Stripe no usuario

## Banco E Adaptadores

O projeto suporta multiplos modos de banco definidos por `DB_TYPE`:

- `sqlite`: desenvolvimento local com arquivo `blog.db`
- `d1`: producao/local Cloudflare com binding `DB`
- `neon`: Postgres serverless
- `libsql`: Turso/LibSQL

Arquivos principais:

- `src/db/index.ts`: escolhe o driver em runtime
- `src/db/dialect.ts`: abstrai tipos do schema entre sqlite e postgres
- `drizzle.config.ts`: configuracao do Drizzle Kit

## Storage De Midia

O modulo de storage possui tres modos:

- `binding`: usa o binding `STORAGE` do Cloudflare R2
- `remote-api`: usa R2 pela API S3 compativel
- `local`: salva uploads em `public/uploads`

Isso permite:

- desenvolver localmente sem depender de R2
- validar fluxo de objetos no Cloudflare local runtime
- servir midia por URL publica ou por `/api/media/:filename`

## Autenticacao E Permissoes

Autenticacao usa **Better Auth** com:

- login por email e senha
- reset de senha por email
- login social via GitHub e Google
- cookies integrados ao TanStack Start
- plugin administrativo com controle de acesso por papel

Papeis definidos:

- `reader`
- `author`
- `editor`
- `moderator`
- `admin`
- `superAdmin`

Regras adicionais implementadas:

- primeiro usuario criado pode receber papel administrativo
- usuario nao pode alterar o proprio papel de forma critica
- usuario nao pode se banir nem se deletar

## Conteudo, Publicacao E SEO

### Posts

Posts suportam:

- titulo
- slug
- excerpt
- conteudo
- SEO por post
- categorias e tags
- autor
- status
- premium
- data de publicacao

Estados usados no fluxo:

- `draft`
- `scheduled`
- `published`

### Paginas

Paginas suportam:

- slug unico
- titulo
- excerpt
- conteudo
- SEO
- status
- flag `isHome` para homepage administravel

### SEO

Configuracoes globais controlam:

- URL publica do site
- metadados padrao
- imagem OG padrao
- handle do Twitter/X
- indexacao por robos
- branding e descricao

## Analytics

O projeto integra **PostHog** em duas frentes:

- client-side tracking via provider React
- consultas server-side no dashboard para estatisticas agregadas

O dashboard de analytics busca, quando configurado:

- pageviews
- visitantes unicos
- views por dia
- paginas mais visitadas
- navegadores
- tipos de dispositivo

Tambem ha eventos relacionados a assinatura com Stripe.

## Newsletter, Comentarios E Comunicacao

### Newsletter

- inscricao publica de subscribers
- reativacao de subscriber inativo
- pagina administrativa para lista de inscritos
- base de newsletters e logs no schema

### Comentarios

- envio publico de comentario
- comentarios entram como `pending`
- moderacao pelo dashboard

### Contato

- mensagens de contato persistidas no banco
- inbox administrativo no dashboard

### Webhooks

- cadastro de webhooks por evento
- envio HTTP `POST` com payload JSON
- registro de status, duracao, resposta e erro de cada entrega

## Menus, Redirects E Branding

O projeto tambem possui base de CMS para operacao do site:

- menus `primary` e `footer` mantidos no banco
- links internos e externos
- redirects gerenciados com `statusCode`
- branding por nome, descricao, logo, fontes e tema
- links sociais

## Temas E Internacionalizacao

### Temas

Existem varias variacoes visuais em `src/styles/themes`, com selecao pelo dashboard.

O modulo de settings permite configurar:

- `themeVariant`
- `fontFamily`
- logo
- descricao do projeto
- links sociais

### i18n

Internacionalizacao usa `@inlang/paraglide-js`.

Configuracao atual:

- locale base: `en`
- locales disponiveis: `en` e `de`
- estrategia por URL com `baseLocale`

## Agendamento E Automacao

O projeto possui publicacao agendada de posts.

Como funciona:

- posts com status `scheduled` e `publishedAt` vencido sao localizados
- o Worker executa `publishScheduledPosts`
- os posts sao promovidos para `published`
- webhooks `post.published` sao disparados

Entrypoints envolvidos:

- `src/server-entry.ts`: handler `scheduled`
- `src/server/post-actions.ts`: regra de publicacao agendada
- `src/routes/api/cron.publish.ts`: fallback/manual trigger por HTTP

No Cloudflare, o cron esta configurado em `wrangler.jsonc` para rodar a cada 5 minutos.

## Variaveis De Ambiente

Copie `.env.example` para `.env.local` ou `.env`.

### Banco

```bash
DB_TYPE=sqlite
DATABASE_URL=blog.db
DATABASE_AUTH_TOKEN=
```

### Cloudflare D1

```bash
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_D1_TOKEN=
```

### Auth

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Cloudflare R2

```bash
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ACCOUNT_ID=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

### Cron

```bash
CRON_SECRET=
```

### Analytics

```bash
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_PROJECT_ID=
POSTHOG_PERSONAL_API_KEY=
```

### Outros servicos

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

Observacao: parte dessas chaves pode ser fornecida por bindings/segredos no Cloudflare em producao, mesmo que o `.env` seja usado no desenvolvimento.

## Como Rodar Localmente

### Requisitos

- Node.js 20+
- pnpm
- opcionalmente Wrangler para validar runtime Cloudflare

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env.local
```

No Windows PowerShell, voce pode criar/copiar manualmente o arquivo se preferir.

### 3. Escolher o modo de banco

Para desenvolvimento simples, use:

```bash
DB_TYPE=sqlite
DATABASE_URL=blog.db
```

### 4. Rodar migracoes

```bash
pnpm db:migrate
```

### 5. Popular dados de exemplo

```bash
pnpm seed
```

### 6. Subir o projeto

```bash
pnpm dev
```

Aplicacao disponivel em `http://localhost:3000`.

## Desenvolvimento Com Cloudflare

Para validar bindings e runtime de Worker localmente:

```bash
pnpm dev:cf
```

Para testar eventos agendados:

```bash
pnpm dev:cf:scheduled
```

Depois acesse:

```text
http://localhost:3000/__scheduled
```

## Scripts Importantes

```bash
pnpm dev                 # Vite dev server
pnpm dev:cf             # Worker local com Wrangler
pnpm dev:cf:scheduled   # Worker local com suporte a scheduled
pnpm build              # build de producao
pnpm preview            # preview local do build
pnpm lint               # lint
pnpm lint:fix           # lint com correcao
pnpm test               # testes com Vitest
pnpm seed               # popula dados de exemplo
pnpm seed:cf            # prepara D1 local e roda seed
pnpm db:migrate         # migracoes locais
pnpm db:migrate:prod    # migracoes para producao
pnpm db:generate        # gera migration Drizzle
pnpm db:push            # push schema
pnpm db:pull            # pull schema
pnpm db:studio          # Drizzle Studio
pnpm deploy             # migrate prod + build + wrangler deploy
```

## Deploy

O fluxo de deploy foi pensado para Cloudflare Workers.

Configuracao principal em `wrangler.jsonc`:

- `main`: `./src/server-entry.ts`
- `d1_databases`: binding `DB`
- `r2_buckets`: binding `STORAGE`
- `triggers.crons`: execucao a cada 5 minutos
- `compatibility_flags`: `nodejs_compat`

Deploy padrao:

```bash
pnpm deploy
```

Isso executa:

1. migracao de banco para producao
2. build da aplicacao
3. `wrangler deploy`

## Seed E Dados De Exemplo

O script `seed.ts` cria:

- usuarios
- categorias
- tags
- posts publicados
- relacoes entre posts, categorias e tags
- configuracoes iniciais do projeto

Ele usa `@faker-js/faker` para gerar conteudo de demonstração.

## Testes

O projeto usa **Vitest** com ambiente `jsdom`.

Ha testes cobrindo areas como:

- schema CMS
- SEO
- paginacao
- storage
- editorial preview
- dominio e busca de posts

## Arquivos Importantes

- `package.json`: scripts e dependencias
- `vite.config.ts`: plugins Vite, Paraglide, TanStack e proxy para PostHog
- `wrangler.jsonc`: config do Worker, D1, R2 e cron
- `drizzle.config.ts`: config do Drizzle Kit
- `src/server-entry.ts`: entrada do Worker e eventos scheduled
- `src/db/schema.ts`: schema central
- `src/lib/auth.ts`: configuracao do Better Auth
- `src/lib/storage.ts`: storage local/R2
- `src/lib/cms.ts`: carregamento de settings e menus globais

## Documentacao Interna

- `docs/README.md`: hub da documentacao de engenharia
- `docs/vision.md`: visao do produto
- `docs/current-state.md`: o que ja existe e o que ainda esta parcial
- `docs/roadmap.md`: prioridades de evolucao

## Documentacao De Engenharia

Para manutencao, consistencia arquitetural e onboarding tecnico, use [`docs/README.md`](./docs/README.md) como ponto de entrada principal.

Esse hub concentra:

- arquitetura
- estrutura do projeto
- convencoes
- fluxos principais
- operacao
- testes e qualidade
- auditoria de consistencia
- backlog tecnico derivado da auditoria

## Licenca

Este projeto esta licenciado sob a **MIT License**.
