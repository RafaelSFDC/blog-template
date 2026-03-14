# Estrutura Do Projeto

## Principio Geral

O repositorio deve ser lido como um CMS full-stack com tres superficies de produto:

- site publico
- dashboard administrativo
- APIs e integracoes

Cada nova feature deve deixar claro em qual dessas superficies atua e onde sua regra de negocio principal vive.

## Mapa Das Pastas Principais

### `docs/`

Documentacao de produto e engenharia.

Uso recomendado:

- produto e visao: `vision.md`, `current-state.md`, `roadmap.md`
- engenharia e manutencao: demais arquivos deste diretorio

### `db/`

Scripts de migracao e utilitarios de banco executados via `tsx`.

Use quando a mudanca for operacional ou de migracao e nao fizer parte do runtime da app.

### `drizzle/`

Migrations SQL geradas/aplicadas pelo Drizzle.

Regra:

- schema novo ou alterado deve resultar em migration correspondente

### `public/`

Assets publicos do app e uploads locais.

Regra:

- so deve conter arquivos que podem ser servidos diretamente
- nao usar esta pasta para dados de negocio

### `src/components/`

Camada de UI reutilizavel.

Subareas atuais:

- `ui`: primitives e componentes genericos
- `dashboard`: UI administrativa
- `blog`: UI editorial publica
- `cms`: componentes de builder e renderizacao de paginas
- `auth`: componentes ligados a login
- `analytics`: providers e wrappers de analytics
- `tiptap`: editor rico e extensoes

Regra:

- componente novo vai para o subdominio que o consome primeiro
- so sobe para `ui` quando for realmente generico

### `src/db/`

Camada de persistencia.

- `schema.ts`: contratos do banco
- `dialect.ts`: abstrai sqlite/postgres no schema
- `index.ts`: escolhe driver em runtime

### `src/hooks/`

Hooks React compartilhados.

Regra:

- hooks de dominio devem ser raros e bem delimitados
- hooks de demo/experimento nao devem coexistir com hooks de producao sem rotulo explicito

### `src/integrations/`

Adaptadores de bibliotecas/frameworks.

Hoje:

- Better Auth
- TanStack Query

Use este diretorio para integrar tecnologia externa ao app, nao para implementar regra de negocio.

### `src/lib/`

Helpers, schemas, validacoes e utilitarios compartilhados.

Colocar aqui:

- schemas Zod
- auth helper
- permissions
- SEO
- storage
- CMS helper
- webhooks
- preview helper

Nao colocar aqui por padrao:

- casos de uso completos do CMS
- funcoes que representam fluxos de dominio com multiplos passos

Esses devem preferir `src/server/`.

### `src/routes/`

Rotas do sistema.

Subareas:

- `_public`: site publico
- `dashboard`: painel administrativo
- `api`: endpoints HTTP

Regra:

- a rota recebe request, carrega dados e monta tela
- a logica de negocio principal deve ser delegada

### `src/server/`

Casos de uso e fluxos de dominio.

Exemplos:

- criar/editar/publicar post
- CRUD de paginas
- media
- taxonomy
- redirects
- analytics

Regra:

- se a feature precisa de persistencia, validacao, efeitos colaterais ou integracoes, este deve ser o primeiro lugar a considerar

### `src/styles/`

Camada de estilos globais e temas.

Hoje inclui:

- `styles.css`
- `themes/*`

## Onde Colocar Codigo Novo

### Novo componente

- visual generico: `src/components/ui`
- layout/admin: `src/components/dashboard`
- publico/editorial: `src/components/blog`
- builder/renderizacao de pagina: `src/components/cms`

### Nova regra de negocio

- preferir `src/server`

### Novo schema de validacao

- preferir `src/lib/cms-schema.ts` ou outro arquivo dedicado em `src/lib`

### Novo helper puro

- preferir `src/lib`

### Nova rota HTTP

- `src/routes/api`

### Nova pagina publica

- `src/routes/_public`

### Nova tela administrativa

- `src/routes/dashboard`

### Nova documentacao tecnica

- `docs/`

## Diferenca Entre Publico, Admin, API E Dominio

### Publico

Responsavel por experiencia do leitor:

- home
- blog
- post
- paginas
- auth publica
- conta
- contato

### Admin

Responsavel por experiencia operacional/editorial:

- CRUDs
- analytics
- settings
- moderacao
- integracoes

### API

Responsavel por entrada HTTP externa ou acoplada ao frontend:

- comentarios
- auth
- media
- newsletter
- Stripe
- cron

### Dominio

Responsavel pelo comportamento de negocio que pode ser reaproveitado por diferentes entradas.

Em geral, esse comportamento deve ficar em `src/server` com apoio de `src/lib`.

## Estado Atual Que Precisa Ser Mantido Em Vista

Ha alguns pontos de estrutura ainda em consolidacao:

- arquivos `demo.*` convivem com o produto principal
- existe duplicacao forte entre algumas telas de create/edit
- ha mais de uma estrategia de edicao de conteudo
- naming de arquivos ainda nao e uniforme

Esses pontos nao devem ser reproduzidos em novas features.
