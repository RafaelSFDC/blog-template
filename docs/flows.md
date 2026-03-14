# Fluxos Principais

## Como Ler Este Documento

Cada fluxo abaixo descreve:

- entrada
- validacao
- persistencia
- renderizacao publica ou retorno
- efeitos colaterais

O foco aqui e o estado atual implementado.

## Fluxo De Post

### Entrada

- dashboard em `src/routes/dashboard/posts/new.tsx`
- dashboard em `src/routes/dashboard/posts/$postId.edit.tsx`

### Validacao

- schema principal: `postFormSchema` e `postServerSchema` em `src/lib/cms-schema.ts`

### Persistencia

- create/update em `src/server/post-actions.ts`
- relacoes com categorias e tags persistidas em `postCategories` e `postTags`

### Regras importantes

- slug e normalizado a partir do titulo ou slug informado
- `publishedAt` e resolvido por `resolvePostPublishedAt`
- posts podem ser `draft`, `scheduled`, `published` ou `private`
- conteudo premium e controlado por `isPremium`

### Renderizacao publica

- listagem em `/_public/blog`
- detalhe em `/_public/blog/$slug`

### Efeitos colaterais

- quando um post entra em `published`, `triggerWebhook("post.published")` pode ser executado
- criacao de post dispara evento de analytics no frontend administrativo

## Fluxo De Pagina

### Entrada

- dashboard em `src/routes/dashboard/pages/new.tsx`
- dashboard em `src/routes/dashboard/pages/$pageId.edit.tsx`

### Validacao

- `pageFormSchema` e `pageServerSchema`

### Persistencia

- `createPage`, `updatePage`, `getPageById` em `src/server/page-actions.ts`

### Regras importantes

- pagina pode ser `draft`, `published` ou `private`
- `isHome` define a homepage gerenciada
- pagina pode usar editor visual com Puck ou conteudo textual serializado

### Renderizacao publica

- homepage publica usa `getPublishedHomepage`
- paginas dinamicas usam `/_public/$`

### Efeitos colaterais

- ao marcar uma pagina como homepage, outras paginas deixam de ser `isHome`
- se uma pagina nao for encontrada, o fluxo ainda tenta resolver redirect por `getRedirectByPath`

## Fluxo De Midia

### Entrada

- dashboard em `src/routes/dashboard/media/index.tsx`

### Validacao

- `mediaUploadSchema`

### Persistencia

- `src/server/media-actions.ts`
- metadados no banco em `media`
- binario em storage resolvido por `src/lib/storage.ts`

### Regras importantes

- nome de arquivo e sanitizado
- modo de storage depende do ambiente

### Renderizacao/entrega

- URL publica direta quando disponivel
- fallback por `/api/media/:filename`

### Efeitos colaterais

- exclusao remove objeto do storage e registro do banco

## Fluxo De Comentario

### Entrada

- envio publico por `/api/comments`
- formulario publico em componentes de blog

### Validacao

- `publicCommentSchema`

### Persistencia

- criacao em `createPendingComment` de `src/server/comment-actions.ts`

### Regras importantes

- comentario novo entra como `pending`
- se existir sessao autenticada, nome/email podem ser derivados dela

### Renderizacao/admin

- moderacao no dashboard em `src/routes/dashboard/comments/index.tsx`

### Efeitos colaterais

- atualmente nao ha anti-spam robusto ou automacao adicional documentada

## Fluxo De Newsletter

### Entrada

- componente publico de newsletter
- unsubscribe em `/api/newsletter/unsubscribe`

### Validacao

- `newsletterSubscribeSchema`

### Persistencia

- `subscribeNewsletter` em `src/server/newsletter-actions.ts`
- subscriber persistido em `subscribers`

### Regras importantes

- email e normalizado para lowercase
- subscriber existente pode ser reativado

### Renderizacao/admin

- gestao de inscritos no dashboard

### Efeitos colaterais

- hoje o fluxo cobre cadastro e gestao basica; nao ha motor completo de campanhas consolidado

## Fluxo De Assinatura Stripe

### Entrada

- checkout em `/api/stripe/checkout`
- webhook em `/api/stripe/webhook`

### Validacao

- sessao autenticada obrigatoria para checkout
- `priceId` obrigatorio
- assinatura webhook verificada por `STRIPE_WEBHOOK_SECRET`

### Persistencia

- usuario recebe `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId` e `stripeCurrentPeriodEnd`

### Regras importantes

- checkout cria sessao Stripe em modo subscription
- `userId` e salvo em metadata
- webhook trata `checkout.session.completed`
- webhook tambem trata `invoice.payment_succeeded`

### Efeitos colaterais

- eventos de analytics no PostHog:
  - `subscription_checkout_created`
  - `subscription_activated`

## Fluxo De Publicacao Agendada

### Entrada

- cron nativo do Worker em `src/server-entry.ts`
- fallback manual por `/api/cron/publish`

### Validacao

- fallback HTTP pode exigir `CRON_SECRET`
- posts agendados sao filtrados por status e `publishedAt <= now`

### Persistencia

- `publishScheduledPosts` em `src/server/post-actions.ts`

### Regras importantes

- post `scheduled` vencido vira `published`
- `updatedAt` e atualizado

### Efeitos colaterais

- webhook `post.published` disparado para cada post promovido
- logs em runtime do Worker

## Fluxo De Contato

### Entrada

- pagina publica `/_public/contact`

### Validacao

- `contactFormSchema`

### Persistencia

- `contactMessages` por server function local da rota

### Renderizacao/admin

- inbox administrativa em `src/routes/dashboard/messages.tsx`

### Efeitos colaterais

- mensagem entra com status `new`
- nao ha fluxo formal de resposta por email implementado
