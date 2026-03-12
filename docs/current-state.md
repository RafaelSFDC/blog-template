# Lumina Current State

## Resumo

Hoje o Lumina já está além de um simples template de blog. O repositório já aponta para um CMS editorial em construção, com base pública funcional, dashboard administrativo, modelagem de dados ampla e integrações importantes já iniciadas.

Ao mesmo tempo, parte desse escopo ainda está em estágio intermediário. Há áreas que já funcionam como produto, áreas que parecem parciais e áreas que ainda representam preparação estrutural para o objetivo maior.

## O que já temos funcional

### Base pública do site

- Home pública.
- Listagem de posts no blog.
- Página individual de post.
- Páginas de categoria e tag.
- Páginas dinâmicas públicas por slug.
- Páginas de autenticação.
- Página de conta.
- Página de contato.

### Gestão editorial principal

- Dashboard administrativo separado da área pública.
- Listagem e gestão de posts.
- Criação e edição de posts.
- Listagem e gestão de páginas.
- Criação e edição de páginas.
- CRUD de categorias.
- CRUD de tags.
- Upload e remoção de mídia.
- Moderação de comentários.
- Gestão de usuários.
- Gestão de assinantes.

### Editor e conteúdo

- Editor rico com Tiptap.
- Fluxo de conteúdo baseado em Markdown.
- Suporte a headings, links, imagens, alinhamento, underline e embeds como YouTube.
- Estrutura de posts com título, resumo, conteúdo, capa, SEO, autor, status, premium e publicação.
- Estrutura de páginas com slug, conteúdo, status, SEO e definição de homepage.

### SEO, descoberta e distribuição

- Sitemap XML.
- RSS feed.
- SEO por post e configuração global de SEO.
- Slugs amigáveis.
- Metadados como meta title, meta description e Open Graph.
- Controle básico de indexação.

### Audiência e monetização

- Comentários nativos.
- Newsletter e base de subscribers.
- Exportação de assinantes em CSV.
- Integração inicial com Stripe para checkout de assinatura.
- Controle de conteúdo premium no modelo de dados e na renderização pública.

### Plataforma e arquitetura

- Autenticação com Better Auth.
- Papéis de acesso como reader, author, editor, moderator, admin e superAdmin.
- Banco de dados com Drizzle.
- i18n base com `inlang/paraglide`.
- Analytics com PostHog.
- Deploy orientado a Cloudflare.
- Testes unitários cobrindo schemas, SEO, paginação, storage e domínio/busca de posts.

## O que existe, mas parece parcial

### Fluxo editorial avançado

- Há suporte a rascunho e agendamento, mas ainda não aparece como um fluxo editorial maduro e completo.
- Não há evidência de versionamento de conteúdo.
- Não há evidência clara de autosave.
- Não há sinais de workflow de revisão editorial mais completo entre autor e editor.

### Dashboard e módulos administrativos

- Existem áreas para `menus`, `redirects`, `messages`, `newsletters`, `analytics`, `settings` e `webhooks`.
- Parte dessas áreas já tem backend e interface útil, mas o conjunto ainda parece mais “CMS em evolução” do que “painel consolidado”.
- Analytics aparenta ser útil, porém ainda não parece uma suíte profunda de métricas editoriais e de negócio.
- Newsletter tem gestão e base de inscritos, mas ainda não está claro como fluxo completo de criação, envio, automação e histórico de campanhas.

### Personalização visual para não programadores

- Há configuração de branding, tema, fontes, logo e links sociais.
- Existe dark mode e base visual bem trabalhada.
- Ainda não há sinais de sistema robusto de temas intercambiáveis.
- A personalização no-code ainda não parece completa o bastante para competir diretamente com a maturidade visual do WordPress.

### Operação e robustez

- Há agendamento, integrações, webhooks e boa base de deploy.
- Ainda não há evidência forte de backup automatizado, recuperação, trilhas de auditoria, observabilidade madura ou governança operacional completa.
- A cobertura de testes existe, mas ainda parece longe de incluir fluxos end-to-end amplos do CMS.

## O que já está preparado na base técnica

### Modelagem de dados

O schema já cobre uma base ampla de CMS, incluindo:

- usuários
- sessões, contas e verificação
- categorias
- tags
- mídia
- posts
- páginas
- comentários
- subscribers
- webhooks e entregas
- redirects
- mensagens de contato
- app settings
- campos ligados a Stripe e premium

### Integrações e extensibilidade inicial

- Webhooks com registro de entrega.
- API de mídia.
- Exportação de posts.
- Endpoints de autenticação.
- Endpoint de publicação agendada.
- Endpoint de Stripe checkout e webhook.

Essa base mostra que o projeto já foi pensado como CMS extensível, mesmo sem ainda ter um sistema formal de plugins.

## Lacunas principais até o objetivo final

Estas frentes ainda devem ser tratadas como incompletas ou ausentes no estado atual:

- revisão editorial avançada
- histórico de versões
- autosave
- preview editorial mais completo
- temas intercambiáveis
- customização visual realmente no-code
- automações editoriais e de audiência mais robustas
- analytics mais profundos
- backup e recuperação
- importação e migração de conteúdo
- camada formal de extensibilidade
- suíte end-to-end mais forte

## Leitura objetiva do estágio atual

Hoje o Lumina já pode ser descrito como um **CMS editorial moderno em construção**, e não apenas como um blog template.

O produto já possui:

- base pública navegável
- painel administrativo relevante
- modelagem de dados rica
- autenticação e permissões
- editor
- mídia
- SEO
- newsletter
- monetização inicial
- analytics inicial

O que falta é transformar essa boa base em um produto mais completo, coeso e confiável para competir como alternativa open source real a um WordPress moderno.
