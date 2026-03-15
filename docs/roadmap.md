# Roadmap do Lumina

## Objetivo

Transformar o Lumina em um CMS editorial completo, com experiencia proxima de WordPress moderno, mas aproveitando a stack atual:

- TanStack Start + React 19 para app publico e painel
- Cloudflare Workers para runtime
- D1 para dados relacionais
- R2 para midia
- Better Auth para autenticacao
- Stripe para monetizacao
- Resend para email
- PostHog para analytics
- Drizzle ORM para schema e migracoes

O foco do produto deve ser:

- blog de noticias
- blog pessoal
- revista digital
- publicacao com conteudo premium
- operacao multiusuario com fluxo editorial

## Resumo Executivo

O projeto ja tem uma base forte e bem acima de um starter comum. Hoje ele ja cobre:

- area publica de blog
- CRUD de posts e paginas
- categorias, tags, comentarios, midia e menus
- dashboard administrativo
- SEO basico
- newsletter basica
- integracao inicial com Stripe
- agendamento via cron
- analytics com PostHog
- papeis de usuario

Mas ainda nao esta pronto para ser considerado um CMS editorial completo no nivel de um WordPress bem configurado.

As maiores lacunas atuais sao:

- permissoes multiusuario ainda superficiais
- fluxo editorial incompleto
- ausencia de revisoes, autosave e trilha de auditoria
- monetizacao ainda basica demais para memberships de verdade
- newsletter e automacoes ainda sem robustez operacional
- falta de protecoes antiabuso e seguranca operacional
- cobertura de testes e observabilidade ainda insuficiente
- faltam rotinas de operacao, backup, importacao e manutencao

## Leitura do Estado Atual

Com base no codigo atual, o Lumina ja possui:

### Fundacao de plataforma

- runtime em Cloudflare Workers via `wrangler.jsonc`
- D1 como banco principal em producao
- fallback local em SQLite
- R2 para media com fallback local e acesso via binding/API
- schema centralizado em `src/db/schema.ts`
- organizacao full-stack consistente em `src/routes`, `src/server`, `src/lib` e `src/components`

### Produto publico

- home
- listagem de posts
- pagina de post
- paginas dinamicas
- categorias e tags
- autenticacao
- conta do usuario
- contato
- RSS e sitemap

### CMS e painel

- dashboard com modulos centrais
- CRUD de posts
- CRUD de paginas
- gestao de categorias e tags
- media library inicial
- comentarios com moderacao basica
- settings globais
- menus
- redirects
- webhooks
- newsletters
- usuarios e subscribers

### Receita e crescimento

- paywall simples por post premium
- checkout Stripe para assinatura recorrente
- webhook Stripe persistindo estado no usuario
- newsletter opt-in
- analytics com PostHog

## Principios do Roadmap

O roadmap precisa respeitar a stack atual e evitar refazer o produto do zero. A direcao recomendada e:

1. consolidar o core editorial e multiusuario
2. fechar a monetizacao de forma confiavel
3. profissionalizar growth, distribuicao e analytics
4. elevar operacao, seguranca e testes para nivel de producao

## Funcionalidades Necessarias

### 1. Core editorial

Essas funcionalidades sao obrigatorias para o Lumina cumprir a promessa de "blog completo tipo WordPress":

- posts com rascunho, revisao, agendamento, publicacao e arquivamento
- paginas institucionais e landing pages
- categorias e tags com SEO proprio
- biblioteca de midia reutilizavel
- menus navegaveis
- redirects e controle de slug
- preview real de conteudo antes da publicacao
- busca interna de conteudo
- blocos/editor ricos com componentes reutilizaveis
- sitemap, RSS e metadados tecnicos

### 2. Operacao multiusuario

Aqui esta uma das maiores diferencas entre um blog simples e um CMS editorial real:

- convites de usuarios
- onboarding de equipe
- ownership por conteudo
- regras por papel e por acao
- autores limitados ao proprio conteudo
- revisores e editores com aprovacao/publicacao
- moderadores de comentarios
- trilha de auditoria de acoes administrativas
- historico de alteracoes por post/pagina
- notificacoes internas ou por email para mudancas de status

### 3. Conteudo pago e memberships

Hoje existe a base, mas ainda nao existe um sistema completo de assinaturas:

- planos de assinatura
- pagina de oferta/planos
- paywall consistente em posts e paginas
- controle de entitlement por usuario
- billing portal para cancelamento e troca de plano
- estados de assinatura: trial, active, past_due, canceled, expired
- grace period
- conteudo exclusivo para assinantes
- newsletters exclusivas para membros
- regras de acesso server-side centralizadas

### 4. Comentarios e comunidade

Para blogs de noticias e blogs pessoais, isso precisa ser robusto:

- fila de moderacao
- anti-spam
- rate limit
- bloqueio de links maliciosos
- reputacao basica de usuario
- resposta a comentario
- aprovacao, rejeicao e banimento de remetente
- opcao de desativar comentarios por post

### 5. SEO, crescimento e distribuicao

- SEO global e por documento
- canonical
- Open Graph e Twitter
- controle de indexacao
- schema.org para article, breadcrumb e organization
- RSS confiavel
- newsletter operacional
- automacoes de distribuicao
- webhooks de publicacao
- analytics editorial por post, autor, origem e conversao

### 6. Operacao e confiabilidade

- backups
- restore testado
- logs de erro
- monitoramento
- fila para tarefas assicronas
- reprocessamento de falhas
- idempotencia em webhooks
- protecao de rotas administrativas
- testes automatizados
- ambientes consistentes de dev, staging e prod

## Gaps Reais Identificados Na Base Atual

### Prioridade critica

- O modelo de roles existe, mas as acoes principais ainda dependem muito de `requireAdminSession()`, o que impede um fluxo editorial realmente multiusuario.
- Nao existe revisao/versionamento de posts e paginas.
- Nao existe autosave de rascunho.
- Nao existe audit log administrativo.
- O acesso premium depende basicamente de campos Stripe no usuario, sem uma camada clara de entitlement e sem billing self-service.
- Nao ha sistema de convites para equipe nem aprovacao de colaboradores.
- A newsletter ainda esta num nivel de CRUD/cadastro, sem pipeline robusto de envio.
- A cobertura de testes e muito pequena para a criticidade do produto.

### Prioridade alta

- Falta workflow editorial completo com estados, aprovacao e ownership.
- Falta status mais ricos para conteudo e para assinatura.
- Falta governanca de media, como substituicao segura, metadados, organizacao e limpeza de arquivos orfaos.
- Falta seguranca antiabuso em comentarios, contato e auth.
- Falta fila para email, webhooks e campanhas.
- Falta analytics de negocio mais proximos do produto editorial.

### Prioridade media

- Busca ainda pode evoluir para relevancia melhor e filtros mais fortes.
- Falta importacao de conteudo legado.
- Falta exportacao estruturada mais ampla.
- Falta experiencia de onboarding de publicacao nova.
- Falta customizacao mais profunda de tema e layout sem tocar codigo.

## Roadmap Recomendado

### Fase 0 - Alinhar o produto

Objetivo: congelar a definicao do que o Lumina vai ser nos proximos ciclos.

Entregas:

- definir posicionamento oficial como CMS editorial single-site
- definir ICP principal: blog pessoal, portal de noticias pequeno/medio, revista digital
- definir nivel de monetizacao esperado no v1
- definir quais papeis entram no MVP: reader, author, editor, moderator, admin
- definir o que fica fora do escopo inicial: multisite, marketplace, editor colaborativo em tempo real

Saida esperada:

- documento de requisitos do MVP
- matriz de papeis e permissoes
- definicao de KPIs de produto

### Fase 1 - Fundacao editorial multiusuario

Objetivo: tornar o Lumina um CMS realmente usavel por uma equipe.

Entregas obrigatorias:

- trocar as principais acoes de conteudo para permissionamento real por papel
- implementar ownership de posts, paginas e assets
- permitir que `author` gerencie apenas seus itens
- permitir que `editor` revise e publique conteudo de terceiros
- permitir que `moderator` gerencie comentarios sem acesso total ao painel
- criar convites de usuario por email
- criar pagina de onboarding para convite aceito
- registrar audit log de acoes administrativas
- criar tabela de revisions para posts e paginas
- criar compare/restore de versoes
- criar autosave de rascunho
- criar lock de edicao leve para evitar sobrescrita acidental
- consolidar preview editorial

Mudancas de dados sugeridas:

- `post_revisions`
- `page_revisions`
- `activity_logs`
- `invitations`
- `content_locks`
- `media_folders` ou metadados equivalentes

Resultado esperado:

- um time pequeno consegue operar o CMS sem depender de um unico admin

### Fase 2 - Workflow editorial profissional

Objetivo: suportar rotina de redacao e publicacao com menos risco.

Entregas obrigatorias:

- expandir estados de conteudo para algo como `draft`, `in_review`, `scheduled`, `published`, `archived`
- adicionar checklist editorial por documento
- adicionar campo de autor, editor responsavel e datas do fluxo
- comentarios internos no editor
- solicitacao de revisao
- aprovacao editorial
- publicar/despublicar com historico
- agendamento mais robusto e visivel no painel
- filtros por status, autor, data e taxonomia
- busca administrativa
- acao em lote para posts, comentarios e media

Resultado esperado:

- processo editorial previsivel para noticias, colunas e blog posts

### Fase 3 - Memberships e conteudo pago de verdade

Objetivo: sair de "post premium com Stripe" para um sistema de receita confiavel.

Entregas obrigatorias:

- centralizar regra de acesso premium em um modulo de entitlement
- suportar multiplos planos
- criar tabela de subscriptions local com historico sincronizado do Stripe
- criar portal do assinante para billing
- tratar cancelamento, inadimplencia e expiracao
- liberar ou bloquear acesso com base em estado real da assinatura
- criar pagina de pricing
- permitir paywall em paginas e nao apenas posts
- permitir conteudo teaser configuravel
- criar experiencia de assinatura na conta do usuario
- criar webhooks idempotentes para eventos do Stripe
- registrar eventos de conversao no PostHog

Mudancas de dados sugeridas:

- `subscriptions`
- `subscription_events`
- `membership_plans`
- `content_entitlements` caso o produto evolua alem de um unico plano global

Resultado esperado:

- o produto consegue vender assinatura sem intervencao manual

### Fase 4 - Newsletter, distribuicao e automacoes

Objetivo: fazer o Lumina crescer audiencia e distribuir conteudo com confiabilidade.

Entregas obrigatorias:

- separar newsletter de cadastro simples e campanha operacional
- templates de email
- campanhas associadas a post publicado
- agendamento de newsletter
- segmentacao basica de subscribers
- double opt-in opcional
- fila de envio
- retentativa de envio com logs
- tracking de abertura e clique quando fizer sentido
- webhook/eventos de publicacao para integracoes externas
- automacao "post publicado -> campanha opcional -> webhook -> analytics"

Infra recomendada nessa fase:

- usar Cloudflare Queues para envio de email, webhooks e jobs assincronos
- manter Resend como provedor de email transacional/campanha inicial

Resultado esperado:

- publicacao e distribuicao passam a funcionar como um fluxo, nao como tarefas isoladas

### Fase 5 - SEO editorial, descoberta e performance

Objetivo: competir bem em blog pessoal e noticias.

Entregas obrigatorias:

- schema.org para article, person, organization e breadcrumb
- canonical e metadados coerentes em todas as rotas
- noindex granular por documento
- paginas de autor
- paginas de arquivo por data se fizer sentido
- busca publica melhorada
- recomendacao de posts relacionados por taxonomia
- optimizacao de imagens e tamanhos derivados
- placeholders e fallback de imagem
- melhoria de cache publico e privado
- controle de redirects com validacao

Infra recomendada nessa fase:

- considerar Cloudflare Images no futuro se o volume de media crescer
- considerar KV para caches especificos e invalidacao seletiva

Resultado esperado:

- melhor descoberta organica, melhor navegacao e menor custo operacional

### Fase 6 - Seguranca, compliance e antiabuso

Objetivo: tornar o produto seguro para operar publicamente.

Entregas obrigatorias:

- rate limiting em login, comentarios, contato e newsletter
- Turnstile em formularios publicos sensiveis
- protecao anti-spam em comentarios
- validacao de uploads mais rigorosa
- limites de tamanho e MIME type por asset
- sanitizacao e validacao forte de embeds e links
- auditoria de secrets e configuracoes obrigatorias
- politicas de retencao de dados
- fluxos LGPD basicos: exportar e excluir dados do usuario
- trilha de consentimento para newsletter

Infra recomendada nessa fase:

- usar Cloudflare Turnstile
- usar WAF/regras do Cloudflare conforme o produto sair para producao publica

Resultado esperado:

- superficie de ataque e risco operacional ficam muito menores

### Fase 7 - Operacao, testes e readiness de producao

Objetivo: preparar o Lumina para deploy serio e manutencao continua.

Entregas obrigatorias:

- suite de testes de dominio mais ampla
- testes de integracao para auth, posts, Stripe e newsletter
- testes end-to-end para fluxos criticos
- seeds de ambiente previsiveis
- ambiente de staging
- checklist de release
- backup automatico de D1
- estrategia de restore testada
- dashboards de observabilidade
- alertas para falha de cron, webhook e campanha
- health checks operacionais
- documentacao de runbook

Fluxos que precisam obrigatoriamente de teste E2E:

- cadastro e login
- reset de senha
- criacao e publicacao de post
- revisao/aprovacao editorial
- comentario com moderacao
- upload e renderizacao de media
- compra de assinatura
- perda e retomada de acesso premium
- campanha de newsletter

Resultado esperado:

- o projeto sai de "demo avancada" para "produto operavel"

## Backlog Estruturado Por Area

### Editorial

- revisions
- autosave
- lock de edicao
- checklist editorial
- comentarios internos
- preview real
- status mais ricos
- bulk actions
- filtros administrativos
- historico de publicacao

### Usuarios e permissoes

- convites
- ownership
- permissoes por recurso
- pagina de perfil editorial
- autores publicos
- audit log
- banimento e moderacao mais completos

### Monetizacao

- pricing page
- planos
- subscription ledger local
- billing portal
- grace period
- plano anual/mensal
- coupons no futuro
- exclusividade por tipo de conteudo

### Media

- validacao de upload
- metadados e creditos
- transformacoes de imagem
- organizacao por pasta ou colecao
- limpeza de arquivos orfaos
- reaproveitamento de assets

### Growth e audiencia

- double opt-in
- segmentacao
- campanhas automatizadas
- recomendacao de posts
- analytics por conversao
- eventos editoriais

### Operacao

- queues
- retries
- idempotencia
- dashboards
- backups
- restore
- staging
- runbooks

## O Que Nao Precisa Entrar Agora

Para evitar dispersao, estas frentes devem ficar fora do MVP:

- multisite estilo WordPress network
- plugin marketplace
- page builder totalmente no-code em toda a aplicacao
- editor colaborativo em tempo real
- app mobile dedicada
- headless multi-tenant complexo

Nada disso e proibido no futuro, mas nao deve atrasar a solidificacao do core editorial.

## Recomendacoes Tecnicas Por Stack

### Manter

- TanStack Start como base full-stack
- Drizzle + D1 para o core relacional
- R2 para media
- Better Auth para identidade
- Stripe para billing
- Resend para email
- PostHog para produto e funil

### Adicionar no momento certo

- Cloudflare Queues para jobs assicronos
- Cloudflare Turnstile para formularios publicos
- Cloudflare Images apenas se a exigencia de transformacao crescer
- possivel KV para cache e invalidacao fina

### Nao e prioridade agora

- Durable Objects
- Agents SDK
- arquitetura multiservico
- troca de banco

## Ordem Recomendada De Execucao

1. permissoes multiusuario reais
2. revisions, autosave e audit log
3. workflow editorial completo
4. subscriptions e billing self-service
5. queues para jobs assincronos
6. newsletter operacional
7. antiabuso e seguranca publica
8. testes E2E e readiness de producao
9. SEO avancado e performance fina
10. refinamentos de growth

## Definicao De "Pronto" Para O Objetivo

O Lumina pode ser considerado um blog completo tipo WordPress quando cumprir estes criterios:

- um admin consegue configurar a publicacao sem editar codigo
- uma equipe com author/editor/moderator opera o CMS com permissoes corretas
- posts e paginas possuem preview, revisao, autosave e historico
- uploads, comentarios, redirects, menus e SEO funcionam de ponta a ponta
- conteudo premium e assinaturas funcionam com billing real e revalidacao de acesso
- newsletter e webhooks funcionam com filas, logs e retentativas
- o ambiente possui backup, observabilidade e testes para os fluxos criticos

## MVP Recomendado

Se a ideia for chegar rapido num produto vendavel e utilizavel, o MVP real do Lumina deve incluir:

- posts, paginas, categorias, tags e media estaveis
- usuarios com convites e ownership
- roles funcionais para author, editor, moderator e admin
- revisions e autosave
- comments com moderacao e anti-spam
- settings e SEO consolidados
- subscriptions com Stripe + billing portal
- paywall consistente
- newsletter basica com fila
- testes para fluxos criticos

Tudo depois disso vira acelerador de crescimento, nao fundacao.

## Conclusao

O Lumina ja tem base suficiente para virar um excelente CMS editorial. O principal agora nao e adicionar mais modulos soltos, e sim fechar as lacunas que separam uma base promissora de um produto operavel:

- governanca editorial
- monetizacao confiavel
- automacoes assincronas
- seguranca publica
- operacao de producao

Se a execucao seguir a ordem deste roadmap, o projeto chega muito mais rapido em um produto coerente, forte para blogs de noticias, blogs pessoais premium e publicacoes digitais pequenas e medias.
