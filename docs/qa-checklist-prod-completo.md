# Checklist Completo de QA para PROD (SQLite-Only)

Objetivo: validar 100% das telas, usuarios, funcoes, fluxos e endpoints antes de liberar producao.

Status sugerido de uso:
- Marcar `[x]` apenas apos evidencia (print/log/video/relatorio).
- Registrar bug com rota, usuario, passo, resultado esperado, resultado atual.

## 1) Preparacao de ambiente

- [ ] Rodar `pnpm install --frozen-lockfile`.
- [ ] Rodar `pnpm db:migrate`.
- [ ] Rodar `pnpm seed:fixtures`.
- [ ] Confirmar banco ativo em SQLite (`blog.db`).
- [ ] Confirmar que nao existe dependencia de API externa para os testes locais.
- [ ] Confirmar conta/usuarios de fixture disponiveis.

## 2) Usuarios e perfis (controle de acesso)

Usuarios de fixture (senha: `Password123!`):
- [ ] `admin@lumina.test`
- [ ] `super-admin@lumina.test`
- [ ] `editor@lumina.test`
- [ ] `author@lumina.test`
- [ ] `moderator@lumina.test`
- [ ] `reader@lumina.test`
- [ ] `member@lumina.test`
- [ ] `past-due@lumina.test`

Permissao por papel:
- [ ] `reader` nao acessa dashboard.
- [ ] `author` acessa dashboard com limites corretos.
- [ ] `editor` acessa dashboard com limites corretos.
- [ ] `moderator` acessa moderacao, sem privilegios de admin.
- [ ] `admin` acessa configuracoes administrativas.
- [ ] `super-admin` acessa tudo que `admin` acessa + privilegios exclusivos.

## 3) Gates automaticos (sem API externa)

- [ ] `pnpm lint` verde.
- [ ] `pnpm typecheck` verde.
- [ ] `pnpm test` verde.
- [ ] `pnpm build` verde.
- [ ] `pnpm test:smoke` verde.
- [ ] `pnpm test:e2e` verde.

## 4) Rotas publicas - navegacao e render

Core:
- [ ] `/`
- [ ] `/blog`
- [ ] `/blog/$slug`
- [ ] `/about`
- [ ] `/contact`
- [ ] `/pricing`
- [ ] `/account`

Arquivos e taxonomias:
- [ ] `/blog/archive/$year`
- [ ] `/blog/archive/$year/$month`
- [ ] `/blog/category/$slug`
- [ ] `/blog/tag/$slug`
- [ ] `/author/$slug`

SEO discovery:
- [ ] `/rss/xml` responde XML valido.
- [ ] `/sitemap/xml` responde XML valido.

Rota catch-all/redirect:
- [ ] `/_public/$` resolve fallback/redirect corretamente.

## 5) Autenticacao e conta

Telas:
- [ ] `/auth/login`
- [ ] `/auth/register`
- [ ] `/auth/forgot-password`
- [ ] `/auth/reset-password`
- [ ] `/auth/invite/$token`

Fluxos:
- [ ] Login valido por cada papel principal.
- [ ] Login invalido mostra erro consistente.
- [ ] Rate limit em tentativas repetidas.
- [ ] Verificacao de seguranca (Turnstile, quando aplicavel) com fallback correto.
- [ ] Registro bloqueado apos regra de lock (quando configurado).
- [ ] Logout invalida sessao.
- [ ] Sessao expirada redireciona para login.

Conta e membership:
- [ ] `/account` para `reader`.
- [ ] `/account` para `member`.
- [ ] `/account` para `past-due`.
- [ ] CTA e estados de renovacao/upgrade corretos.

## 6) Blog, editorial e publicacao

Posts:
- [ ] Criar post draft (`/dashboard/posts/new`).
- [ ] Atualizar post existente (`/dashboard/posts/$postId.edit`).
- [ ] Solicitar review (`draft -> in_review`).
- [ ] Aprovar/publicar.
- [ ] Agendar publicacao.
- [ ] Arquivar e desarquivar fluxo esperado.
- [ ] Restaurar revisao com sucesso.
- [ ] Colisao de slug bloqueia com mensagem correta.
- [ ] Preview de post (`/dashboard/preview/post.$postId`).

Pages:
- [ ] Criar pagina (`/dashboard/pages/new`).
- [ ] Editar pagina (`/dashboard/pages/$pageId.edit`).
- [ ] Restaurar revisao de pagina.
- [ ] Preview de pagina (`/dashboard/preview/page.$pageId`).
- [ ] Colisao de slug de pagina bloqueia corretamente.

Listagens e integridade:
- [ ] Lista de blog sem posts duplicados.
- [ ] Arquivo por data sem duplicacao.
- [ ] Paginacao e ordenacao deterministicas.

## 7) Dashboard - modulos por tela

Dashboard base:
- [ ] `/dashboard`
- [ ] `/dashboard/setup`
- [ ] `/dashboard/settings`
- [ ] `/dashboard/analytics`

Conteudo:
- [ ] `/dashboard/posts`
- [ ] `/dashboard/pages`
- [ ] `/dashboard/categories`
- [ ] `/dashboard/tags`
- [ ] `/dashboard/menus`
- [ ] `/dashboard/redirects`

Comunicacao e comunidade:
- [ ] `/dashboard/comments`
- [ ] `/dashboard/messages`
- [ ] `/dashboard/newsletters`
- [ ] `/dashboard/newsletters/new`
- [ ] `/dashboard/newsletters/$newsletterId`
- [ ] `/dashboard/users/subscribers`

Admin e operacao:
- [ ] `/dashboard/users`
- [ ] `/dashboard/webhooks`
- [ ] `/dashboard/webhooks/new`
- [ ] `/dashboard/beta-ops`
- [ ] `/dashboard/media`

## 8) Midia (local-first)

- [ ] Upload de imagem valida (tipo/tamanho ok).
- [ ] Upload invalido por extensao/tipo.
- [ ] Upload invalido por tamanho.
- [ ] Nome de arquivo sanitizado.
- [ ] Persistencia de metadata (alt/title/caption quando aplicavel).
- [ ] Exclusao de arquivo remove registro e objeto local.
- [ ] Bulk delete.
- [ ] Cleanup de orfaos em dry-run.
- [ ] Cleanup de orfaos em execucao real.
- [ ] Garantir que midia referenciada nao e removida.

## 9) Comentarios e moderacao

- [ ] Criacao de comentario valido em post com comentarios habilitados.
- [ ] Bloqueio em post com comentarios desabilitados.
- [ ] Deteccao de spam (`pending/spam/blocked`) conforme regra.
- [ ] Rate-limit/reincidencia funcionando.
- [ ] Moderacao unit (aprovar, marcar spam, deletar).
- [ ] Moderacao em lote (bulk).
- [ ] Auditoria de acoes de moderacao registrada.

## 10) Newsletter e webhooks

Newsletter publico:
- [ ] Subscribe.
- [ ] Confirm (`/api/newsletter/confirm`).
- [ ] Open tracking (`/api/newsletter/open`).
- [ ] Click tracking (`/api/newsletter/click`).
- [ ] Unsubscribe (`/api/newsletter/unsubscribe`).

Webhook:
- [ ] `POST /api/newsletter/webhook` com assinatura valida.
- [ ] Rejeicao de assinatura invalida.
- [ ] Rejeicao de replay.
- [ ] Log de seguranca/auditoria em eventos de rejeicao.

## 11) APIs HTTP (sanidade por endpoint)

Health:
- [ ] `GET /api/health`
- [ ] `GET /api/health/readiness`
- [ ] `GET /api/health/dependencies`

Comments:
- [ ] `POST /api/comments`
- [ ] `PATCH /api/comments/$id`
- [ ] `DELETE /api/comments/$id`

Auth:
- [ ] `GET|POST /api/auth/$` nos principais fluxos.

Midia:
- [ ] `GET /api/media/$` para leitura de objeto.

Export:
- [ ] `GET /api/export/posts`

Jobs:
- [ ] `POST /api/cron.publish`

Stripe (apenas mock/local guard):
- [ ] `POST /api/stripe/checkout` comportamento seguro sem dependencia externa.
- [ ] `POST /api/stripe/billing-portal` comportamento seguro sem dependencia externa.
- [ ] `POST /api/stripe/webhook` validacoes de seguranca.

## 12) SEO e metadados

- [ ] Canonical correto em home.
- [ ] Canonical correto em post.
- [ ] Canonical correto em page.
- [ ] Meta title/description coerentes.
- [ ] Robots/noindex aplicado quando configurado.
- [ ] Feed/sitemap atualizando com conteudo publicado.

## 13) Setup inicial e onboarding

- [ ] Admin redireciona para setup quando necessario.
- [ ] Pausar e retomar setup.
- [ ] Concluir setup com starter kit.
- [ ] Concluir setup sem starter kit.
- [ ] Presets (creator, magazine, premium_publication) aplicam fallback publico correto.
- [ ] Setup concluido nao bloqueia dashboard novamente.

## 14) Seguranca e abuso

- [ ] Rate-limit auth funcionando.
- [ ] Rate-limit comentarios funcionando.
- [ ] Eventos de seguranca persistidos em `security_events`.
- [ ] Logs estruturados com `level/event/timestamp/actor/entity/outcome`.
- [ ] Sem exposicao de segredo em resposta/console de producao.

## 15) Operacao, backup e rollback

- [ ] Backup SQLite manual executavel.
- [ ] Restore SQLite manual executavel.
- [ ] Pos-restore health endpoints verdes.
- [ ] Pos-restore smoke de rotas criticas verde.
- [ ] Drill de incidente SEV-1 revisado.
- [ ] Tempo de rollback dentro da meta operacional.

## 16) Performance e capacidade (baseline local)

- [ ] Baseline de latencia revisado para `/`, `/blog`, `/blog/$slug`, `/rss/xml`, `/sitemap/xml`.
- [ ] Budget de performance atendido.
- [ ] Sem regressao relevante em rota critica desde baseline.

## 17) UX, responsividade e acessibilidade minima

- [ ] Header/footer e navegacao funcionam em desktop.
- [ ] Header/footer e navegacao funcionam em mobile.
- [ ] Formularios principais com label e mensagens de erro.
- [ ] Foco/teclado basico funcional em auth e dashboard.
- [ ] Estados de loading/erro visiveis nas acoes criticas.

## 18) Checklist final de liberacao

- [ ] Todos os itens criticos acima marcados.
- [ ] Nenhum bug P0/P1 aberto.
- [ ] Bugs P2/P3 com decisao explicita (adiar/corrigir).
- [ ] Evidencias anexadas (test logs, screenshots, relatorios).
- [ ] Aprovacao final GO/NO-GO registrada.

## 19) Evidencias recomendadas

- [ ] Saida de `pnpm lint`.
- [ ] Saida de `pnpm typecheck`.
- [ ] Saida de `pnpm test`.
- [ ] Saida de `pnpm build`.
- [ ] Saida de `pnpm test:smoke`.
- [ ] Saida de `pnpm test:e2e`.
- [ ] Arquivos em `artifacts/prod-readiness/*`.
- [ ] Atualizacao do `docs/execution-log.md`.
