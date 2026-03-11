# Roadmap para Transformar o Projeto em um Blog Open Source

## Objetivo

Transformar o projeto em um template open source de blog/CMS, com foco em publicação, performance, monetização e operação simples, sem page builder nesta fase.

## Princípios de produto

- primeiro resolver o core editorial;
- evitar funcionalidades vistosas antes de fechar robustez;
- tudo que existir no dashboard precisa ter validação de servidor;
- tudo que depender de integrações externas precisa degradar com clareza;
- o template precisa funcionar bem localmente e também em Cloudflare.

## Fases recomendadas

## Fase 1: fechar o core do CMS

Objetivo:

- tornar o projeto confiável para um blog real com conteúdo institucional e editorial.

Entregas:

- CRUD de páginas estáticas no dashboard
- navegação global editável
- validação forte no servidor para posts, categorias, tags, settings, comments, newsletter e webhooks
- unificação da camada de mídia
- publicação agendada real
- melhoria do schema de posts para featured image, canonical, noindex e campos editoriais faltantes

Critério de saída:

- uma publicação consegue gerenciar home, about, contact e blog sem editar código.

## Fase 2: endurecer SEO e distribuição

Objetivo:

- tornar o template forte em indexação, descoberta e compartilhamento.

Entregas:

- SEO global por site
- páginas públicas de categoria e tag
- paginação real do blog
- canonical, robots, schema.org, Open Graph global
- busca full-text
- RSS e sitemap puxando settings reais
- redirects 301/302 administráveis

Critério de saída:

- o projeto consegue operar como blog de conteúdo com SEO minimamente competitivo.

## Fase 3: comunidade, newsletter e monetização

Objetivo:

- tornar audiência e receita nativas do produto.

Entregas:

- comentários com antispam, rate limit e moderação melhor
- newsletter assíncrona com filas/jobs
- double opt-in
- preferências de email e unsubscribe robusto
- portal do assinante
- planos Stripe mais completos
- proteção de conteúdo por plano

Critério de saída:

- o template consegue captar leads, moderar comunidade e vender conteúdo premium.

## Fase 4: equipe e operação

Objetivo:

- suportar uso por times pequenos sem virar caos.

Entregas:

- permissões granulares por ação
- ownership de conteúdo
- convites para equipe
- trilha de auditoria
- import/export de posts e settings
- backup/restore documentado
- testes por domínio crítico

Critério de saída:

- o template fica utilizável por times editoriais e não só por um admin único.

## Backlog funcional priorizado

## P0

- páginas estáticas completas
- menus/header/footer editáveis
- validação server-side real com `zod`
- scheduler para posts agendados
- mídia com fallback consistente
- setup inicial documentado
- export/import básico

## P1

- categoria/tag pages
- SEO global
- busca full-text
- newsletter em background
- antispam
- billing portal
- gestão melhor de assinantes

## P2

- revisão editorial
- versionamento
- analytics internos complementares
- API pública
- importador de WordPress

## P3

- marketplace/extensões
- automações avançadas
- page builder

## Mudanças técnicas recomendadas

## 1. Criar uma camada de domínio

Hoje muita regra está espalhada em rotas e server functions.

Recomendo criar módulos centrais como:

- `src/modules/posts/*`
- `src/modules/pages/*`
- `src/modules/newsletter/*`
- `src/modules/subscriptions/*`
- `src/modules/webhooks/*`

Cada módulo deve concentrar:

- schema zod
- regras de negócio
- queries
- mutações
- erros de domínio

## 2. Padronizar validações

Recomendo definir schemas únicos por domínio:

- `postCreateSchema`
- `postUpdateSchema`
- `categorySchema`
- `tagSchema`
- `settingsSchema`
- `contactSchema`
- `newsletterSubscribeSchema`
- `webhookSchema`

Regra:

- validar no client para UX;
- validar no servidor para segurança e integridade;
- normalizar slug e campos derivados no servidor, nunca só no client.

## 3. Resolver mídia de forma única

Hoje há sinais de duas estratégias diferentes.

Definir uma interface única:

- `uploadAsset`
- `deleteAsset`
- `getAssetUrl`

Backends:

- R2 binding
- R2 S3-compatible
- local dev fallback

## 4. Introduzir jobs/schedulers

Casos imediatos:

- publicação agendada
- envio de newsletter
- retries de webhook
- limpeza de mídia órfã

Se continuar em Cloudflare, isso pode ir para:

- Cron Triggers
- Queues
- Workflows, se fizer sentido mais tarde

## 5. Melhorar modelagem de conteúdo

Adicionar ou revisar:

- `pages`
- `menus`
- `authors_profile`
- `post_revisions`
- `redirects`
- `seo_settings`
- `site_settings`
- `newsletter_preferences`

## Checklist de validação antes de abrir como template forte

- criar projeto e subir localmente em menos de 10 minutos
- rodar em `sqlite` local
- rodar em `d1` no Cloudflare
- publicar post, agendar post e editar post
- criar página About e Contact via dashboard
- subir mídia
- ativar newsletter
- ativar Stripe
- ativar analytics
- gerar sitemap e RSS
- moderar comentário
- trocar tema/logo/fontes sem editar código

## Estrutura de documentação recomendada

- `README.md`
  visão geral, quickstart e deploy
- `docs/wordpress-alternative-audit.md`
  auditoria funcional e gaps
- `docs/roadmap-open-source-blog.md`
  roadmap de produto
- `docs/setup-local.md`
  ambiente local
- `docs/setup-cloudflare.md`
  deploy Cloudflare
- `docs/content-model.md`
  entidades do CMS
- `docs/integrations.md`
  Stripe, PostHog, Resend, R2

## Primeiro pacote de execução recomendado

Se a ideia é avançar com eficiência, eu atacaria nesta ordem:

1. páginas estáticas + menus
2. validações server-side padronizadas
3. unificação de mídia
4. scheduler para post agendado
5. SEO global + category/tag pages

Esse pacote muda o projeto de "blog avançado" para "CMS de blog publicável".
