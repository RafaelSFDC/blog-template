# Auditoria do Template como Alternativa ao WordPress

## Objetivo

Este documento avalia o estado atual do projeto para transformá-lo em um template de blog open source que seja uma alternativa prática ao WordPress, sem page builder nesta fase.

O foco aqui é:

- identificar as funcionalidades necessárias para um blog open source robusto;
- mapear o que já existe no projeto;
- apontar o que está parcial ou inconsistente;
- registrar validações, riscos e lacunas técnicas antes de expandir o produto.

## Resumo executivo

O projeto já tem uma base editorial relevante. Ele não é apenas um blog visual: já existe painel administrativo, autenticação, papéis de usuário, CRUD de posts, categorias e tags, comentários com moderação, newsletter, formulário de contato, webhooks, analytics, RSS, sitemap, mídia e paywall com Stripe.

Mesmo assim, ele ainda não substitui o WordPress de forma confiável para uso geral porque faltam três blocos críticos:

- maturidade de CMS: páginas estáticas, revisão editorial, versionamento, workflow e taxonomias mais completas;
- robustez operacional: validações de servidor, upload/mídia mais consistente, background jobs, observabilidade e backups;
- experiência de produto: setup inicial, customização global, SEO mais completo, import/export e documentação de operação.

## Stack e base já existente

### Plataforma

- TanStack Start + React 19 + TanStack Router
- Drizzle ORM
- banco universal com `sqlite`, `d1`, `neon` e `libsql`
- Cloudflare Workers / D1 / R2 via `wrangler`
- Better Auth para autenticação
- Tailwind CSS + sistema grande de temas
- PostHog para analytics
- Resend para email/newsletter
- Stripe para assinatura/paywall

### Domínios já modelados no banco

Arquivos centrais:

- `src/db/schema.ts`
- `src/db/index.ts`

Entidades existentes:

- usuários, sessões, contas e verificações
- posts
- categorias e tags
- mídia
- comentários
- configurações globais
- assinantes, newsletters e logs de envio
- mensagens de contato
- webhooks e entregas
- visitantes e page views

Observação importante:

- existem tabelas para `visitors` e `page_views`, mas a implementação atual de analytics está baseada em PostHog; essas tabelas hoje parecem subutilizadas.

## Matriz funcional

### 1. Publicação e CMS

#### Já existe

- criação, edição, listagem e exclusão de posts no dashboard
- status editorial: `draft`, `published`, `scheduled`, `private`
- editor rico com Tiptap
- slug editável
- excerpt
- SEO por post: `metaTitle`, `metaDescription`, `ogImage`
- categorias e tags
- posts premium
- agendamento por `publishedAt`

Arquivos relevantes:

- `src/routes/dashboard/posts/index.tsx`
- `src/routes/dashboard/posts/new.tsx`
- `src/routes/dashboard/posts/$postId.edit.tsx`
- `src/server/taxonomy-actions.ts`

#### Parcial

- campo `readingTime` existe no banco, mas não vi cálculo consistente no fluxo editorial
- `featuredImageId` existe no schema, porém o editor usa mais `ogImage`/`coverImage`; o vínculo com biblioteca de mídia não está completo
- status `scheduled` existe, mas não há job/scheduler visível para publicar automaticamente quando a data chega
- status `private` existe, mas o comportamento público/admin ainda depende da lógica da rota do post, não de uma política editorial mais ampla

#### Falta

- revisão editorial com workflow real: autor -> editor -> publicação
- histórico de versões
- preview de rascunho protegido
- duplicar post
- autosave
- revisão/compare diffs
- templates de post
- séries/coleções
- páginas estáticas completas no dashboard

Observação:

- a rota `src/routes/dashboard/pages/index.tsx` é apenas um placeholder. Isso impede substituir WordPress para páginas institucionais administráveis.

### 2. Aparência e branding

#### Já existe

- múltiplos temas CSS
- configuração de nome, descrição, logo, fonte e links sociais
- dark/light mode
- páginas públicas com design consistente

Arquivos relevantes:

- `src/routes/dashboard/settings.tsx`
- `src/lib/theme-utils.ts`
- `src/styles/themes/*`

#### Parcial

- customização é mais estética do que estrutural
- não há gestão de navegação global, menus, footer, homepage sections ou widgets
- não há área clara para favicon, Open Graph global, scripts globais, pixels e códigos de terceiros por ambiente

#### Falta

- editor/configuração de header e footer
- menus navegáveis por dashboard
- blocos de homepage
- tema por tenant/projeto, se o template quiser ser multi-site no futuro
- export/import de tema

### 3. SEO, descoberta e distribuição

#### Já existe

- meta tags por post
- sitemap
- RSS
- slugs amigáveis
- listagem pública de posts
- filtro por categoria e busca client-side na página do blog

Arquivos relevantes:

- `src/routes/_public/blog/index.tsx`
- `src/routes/_public/blog/$slug.tsx`
- `src/routes/rss.xml.ts`
- `src/routes/sitemap.xml.ts`

#### Parcial

- sitemap e RSS usam conteúdo fixo e não puxam plenamente as configurações do blog
- não há páginas públicas para categoria/tag com SEO dedicado
- a busca atual é local no front; não existe busca full-text no backend
- SEO global ainda é limitado

#### Falta

- canonical tags
- schema.org estruturado
- noindex por conteúdo privado/draft quando aplicável
- SEO para páginas estáticas
- páginas de autor
- páginas de arquivo por categoria/tag
- paginação real para blog
- busca full-text
- redirect manager 301/302

### 4. Comunidade e audiência

#### Já existe

- comentários com moderação
- newsletter com inscrição
- contato
- conta do usuário
- área de assinatura premium conceitual

Arquivos relevantes:

- `src/routes/dashboard/comments/index.tsx`
- `src/server/newsletter-actions.ts`
- `src/lib/newsletter.ts`
- `src/routes/_public/contact.tsx`
- `src/routes/_public/account.tsx`

#### Parcial

- comentários entram em `pending`, o que é bom, mas não há antispam real, captcha, rate limit nem heurística
- newsletter envia de forma síncrona para todos os assinantes; isso é frágil para escala
- há exportação de assinantes, mas não existe segmentação, campanhas recorrentes ou analytics de abertura/clique
- assinatura premium existe no conteúdo, mas a experiência de gestão do plano ainda é incompleta

#### Falta

- antifraude e anti-spam para comentários e contato
- double opt-in para newsletter
- gestão de consentimento LGPD
- preferências de email
- área de assinante com histórico de cobrança e cancelamento
- automações de onboarding e retenção
- integração com plataformas externas de email marketing

### 5. Monetização

#### Já existe

- `isPremium` por post
- Stripe no fluxo de paywall
- campos de assinatura no usuário

Arquivos relevantes:

- `src/routes/_public/blog/$slug.tsx`
- `src/routes/api/stripe/checkout.ts`
- `src/routes/api/stripe/webhook.ts`
- `src/db/schema.ts`

#### Parcial

- a conta do usuário ainda mostra plano "Free Tier" de forma estática
- monetização parece centrada em uma assinatura única, sem catálogo de planos
- não há gestão robusta de falha de cobrança, trial, upgrade/downgrade, cupons ou portal do cliente

#### Falta

- billing portal
- múltiplos planos
- trial/grace period
- relatórios de receita
- conteúdo por plano/permissão granular

### 6. Equipe, papéis e governança

#### Já existe

- papéis: `reader`, `author`, `editor`, `moderator`, `admin`, `super-admin`
- first user vira admin
- proteções contra autoalteração de papel, autoban e autodelete
- dashboard protegido por role

Arquivos relevantes:

- `src/lib/auth.ts`
- `src/lib/admin-auth.ts`
- `src/routes/dashboard/users/index.tsx`

#### Parcial

- o dashboard de usuários muda papel, mas banimento ainda está marcado como "coming soon"
- exclusão de conta pelo admin não está concluída na UI
- várias áreas do dashboard exigem `requireAdminSession`, o que reduz utilidade para times editoriais com `author` e `editor`

#### Falta

- permissões mais granulares por ação
- ownership de conteúdo
- workflow editorial multiusuário
- trilha de auditoria
- convites para equipe

### 7. Mídia e assets

#### Já existe

- biblioteca de mídia
- upload para R2 via binding
- endpoint para servir mídia
- fallback local no helper `src/lib/storage.ts`

Arquivos relevantes:

- `src/routes/dashboard/media/index.tsx`
- `src/server/media-actions.ts`
- `src/routes/api/media.$.ts`
- `src/lib/storage.ts`

#### Parcial

- há duas abordagens de upload: uma server action que exige binding `STORAGE`, e um helper com fallback local/S3-compatible; isso está inconsistente
- biblioteca do dashboard hoje aceita apenas imagem e não parece usar metadados mais ricos
- não há transformações, resize, crop, blur placeholders ou compressão

#### Falta

- uploads estáveis fora de Cloudflare binding
- seleção de mídia dentro do editor com integração plena
- alt text obrigatório ou validado
- organização por pasta/tag
- suporte a PDF e outros anexos
- limpeza de assets órfãos

### 8. Integrações, extensibilidade e dados

#### Já existe

- webhooks para `post.published`
- registros de entrega
- export CSV de assinantes
- analytics com PostHog

Arquivos relevantes:

- `src/lib/webhooks.ts`
- `src/routes/dashboard/webhooks/index.tsx`
- `src/routes/dashboard/newsletters/index.tsx`
- `src/server/analytics-actions.ts`

#### Parcial

- webhooks têm poucos eventos
- não há API pública/documentada para posts, categorias, comentários e settings
- analytics depende de configuração manual e não há fallback local funcional no painel

#### Falta

- API REST ou GraphQL pública
- tokens de API
- webhooks para comentários, newsletters, assinatura, contato, publicação agendada
- importação/exportação de posts
- migração assistida de WordPress

## Auditoria de validações

## O que já está validado

- formulários com `zod` em categorias, tags, posts e settings
- validações pontuais via TanStack Form em contato, conta, auth
- slugificação no client para posts, categorias e tags
- checagem de autenticação e role em áreas administrativas
- prevenção de ações administrativas destrutivas no próprio usuário autenticado

## O que está parcial ou fraco

### Posts

Problemas observados:

- o formulário usa schema no client, mas `createPost` e `updatePost` usam `.inputValidator((input) => input)`, sem `zod.parse` real no servidor;
- `metaTitle`, `metaDescription` e `ogImage` aceitam qualquer string, sem limites ou formato;
- `publishedAt` entra como `Date`, mas sem validação forte para agendamento;
- não há garantia de unicidade amigável de slug antes de tentar inserir;
- não há validação de comprimento de título, excerpt e conteúdo;
- não há sanitização/normalização forte do conteúdo salvo.

Impacto:

- dados inválidos podem ser enviados ao servidor sem o front padrão;
- mais risco de erro 500 do que erro controlado de negócio;
- API interna fica frágil para futuras automações/importações.

### Categorias e tags

Problemas observados:

- `createCategory` e `createTag` validam com `zod`, mas `updateCategory` e `updateTag` apenas aceitam o payload bruto;
- falta validar unicidade de slug antes de persistir;
- falta normalização centralizada de slug no servidor.

### Settings

Problemas observados:

- settings usam schema no client, mas a server action não faz `parse` real;
- URLs de logo e links sociais não são validadas como URL;
- não há limites de tamanho nem sanitização de strings globais.

### Contact, comentários e newsletter

Problemas observados:

- ações de servidor aceitam payload praticamente cru;
- email da newsletter não é validado via schema na action;
- comentário não tem proteção contra spam, flooding ou conteúdo malicioso;
- contato não tem captcha, rate limit nem bloqueio por IP.

### Webhooks

Problemas observados:

- criação de webhook valida apenas presença, não formato/segurança da URL;
- não há assinatura HMAC, só header simples com secret;
- não há retry policy, backoff, replay nem dead-letter queue.

## Lacunas arquiteturais para um produto open source

Para virar template open source sério, o projeto precisa tratar como primeira classe:

- instalação e bootstrap
- documentação de deploy
- seeds e conteúdo demo opcionais
- estratégia de migrations
- ambiente local e ambiente Cloudflare
- variáveis obrigatórias vs opcionais
- observabilidade
- backups e restore
- testes mínimos por domínio

Hoje a base é boa, mas ainda há muitas regras dispersas em rotas e server functions sem uma camada de domínio mais nítida.

## Itens já fortes o suficiente para manter como diferencial

- suporte multi-driver de banco
- integração natural com Cloudflare
- painel editorial já existente
- sistema de temas amplo
- paywall nativo
- webhooks e analytics já iniciados
- papéis de usuário mais avançados que muitos templates de blog

## Prioridade recomendada

### P0 para ser "alternativa real ao WordPress" em blog

- páginas estáticas administráveis
- validações reais no servidor para todos os fluxos principais
- mídia consistente em Cloudflare e fora dele
- scheduler/publicação agendada real
- SEO global + categoria/tag pages
- setup documentado
- backup/export/import básico

### P1 para competir bem

- workflow editorial multiusuário
- newsletter assíncrona e escalável
- moderação com antispam
- billing/assinatura melhor acabado
- menus, navegação e footer administráveis

### P2 para expandir

- APIs públicas
- automações
- importador de WordPress
- marketplace de extensões
- page builder

## Conclusão

O projeto já tem massa crítica para virar um CMS de blog open source moderno. Ele não precisa começar do zero. A melhor estratégia é tratar o que já existe como núcleo do produto e agora atacar consistência, validação, páginas estáticas, SEO estrutural e operação.

Se isso for feito, o template deixa de ser "um blog bonito com dashboard" e passa a ser uma alternativa realista ao WordPress para publicações pequenas e médias.
