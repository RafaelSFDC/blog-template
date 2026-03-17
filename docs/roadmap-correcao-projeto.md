# Roadmap Completo de Correcao do Projeto (Lumina)

Data de referencia: 17 de marco de 2026
Objetivo: corrigir riscos de seguranca, restaurar confiabilidade do build, reduzir inconsistencias de tipagem/schema e eliminar logica duplicada.

## 1. Principios de Execucao

- [ ] Tratar seguranca e confiabilidade de build como bloqueadores de release.
- [ ] Corrigir primeiro o que pode impactar producao (P0), depois manter qualidade estrutural (P1/P2).
- [ ] Cada fase so avanca com criterios de saida validados.
- [ ] Toda mudanca relevante deve incluir teste automatizado.
- [ ] Evitar novas duplicacoes: centralizar constantes/schemas compartilhados.

## 2. Priorizacao (P0, P1, P2)

- P0 (critico): open redirect, segredos fallback hardcoded, placeholders inseguros, URLs de localhost em fluxos externos.
- P1 (alto): lint/tsc quebrado, tipagem fragil na camada DB, drift de schema/tipos duplicados.
- P2 (medio/baixo): limpeza de fixtures, consistencia de hooks/componentes, padronizacao e reducao de debt tecnica.

## 3. Fase 0 - Contencao e Baseline (Dia 1)

### Objetivo
Congelar risco e criar baseline objetiva de qualidade.

### Checklist

- [ ] Criar branch de trabalho dedicada (`codex/roadmap-correcao` ou equivalente).
- [ ] Executar e registrar baseline atual:
- [ ] `pnpm run lint`
- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm run test:unit`
- [ ] `pnpm run test:integration`
- [ ] Abrir board de tarefas com tags `P0`, `P1`, `P2`.
- [ ] Definir responsaveis por trilha:
- [ ] Trilha Seguranca/API
- [ ] Trilha Tipagem/DB
- [ ] Trilha Testes/Fixtures
- [ ] Trilha Frontend/UX

### Criterio de saida

- [ ] Baseline capturado e publicado no board.
- [ ] Donos definidos por trilha.

## 4. Fase 1 - Correcao de Seguranca (P0) (Dias 1-2)

### Objetivo
Eliminar vetores criticos exploraveis.

### Checklist

- [ ] Corrigir open redirect em `/api/newsletter/click`:
- [ ] Validar URL de destino com utilitario de seguranca.
- [ ] Bloquear protocolos inseguros e URLs invalidas.
- [ ] Definir politica: permitir apenas `https` (e excecoes locais apenas em dev/test).
- [ ] Tratar segredo de newsletter:
- [ ] Remover fallback `"lumina-newsletter-secret"`.
- [ ] Falhar explicitamente quando segredo nao estiver configurado em producao.
- [ ] Corrigir inicializacao do Stripe:
- [ ] Remover fallback `"sk_test_placeholder"`.
- [ ] Falhar cedo com erro claro quando `STRIPE_SECRET_KEY` faltar.
- [ ] Remover fallback de `localhost` em links externos sensiveis:
- [ ] Convites (`BETTER_AUTH_URL`)
- [ ] Checkout/Billing Portal (`APP_URL`)
- [ ] Newsletter site URL (`APP_URL`/settings)
- [ ] Criar testes de seguranca:
- [ ] Teste para rejeicao de redirect inseguro.
- [ ] Teste para erro quando segredos obrigatorios faltarem.
- [ ] Teste de construcao de links externos com base URL valida.

### Criterio de saida

- [ ] Nenhum fallback inseguro ativo em producao.
- [ ] Testes de seguranca passando.

## 5. Fase 2 - Build Health e Qualidade Minima (P1) (Dias 2-3)

### Objetivo
Restaurar pipeline de qualidade para voltar a ter deploy confiavel.

### Checklist

- [ ] Corrigir erros de lint do frontend:
- [ ] `setState` em efeito no beta form.
- [ ] caracteres JSX nao escapados em marketing shell.
- [ ] Corrigir erros de lint/typecheck em testes:
- [ ] imports/vars nao usados.
- [ ] parametros implicitos `any`.
- [ ] `result.error` potencialmente `undefined`.
- [ ] Corrigir inconsistencias de typing em `tests/fixtures/seed-fixtures.ts`.
- [ ] Reexecutar:
- [ ] `pnpm run lint`
- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm run test:unit`
- [ ] `pnpm run test:integration`

### Criterio de saida

- [ ] Lint zerado.
- [ ] Typecheck zerado.
- [ ] Testes unitarios e de integracao verdes.

## 6. Fase 3 - Tipagem Estrutural e Schema Cohesion (P1) (Dias 3-5)

### Objetivo
Reduzir risco de regressao por `any` e casts perigosos em areas centrais.

### Checklist

- [ ] Refatorar camada `src/db/dialect.ts` para reduzir `any` e `as unknown as`.
- [ ] Refatorar `src/db/index.ts` para tipagem de retorno por driver com interfaces claras.
- [ ] Definir estrategia unica para acesso a env/bindings (Cloudflare + Node) sem duplicacao confusa.
- [ ] Centralizar tipos de beta request:
- [ ] Derivar tipos com `z.infer` do schema.
- [ ] Remover unions duplicadas em client/server.
- [ ] Adicionar testes de contrato de schema:
- [ ] Garantir paridade entre schema, formulario e server action.

### Criterio de saida

- [ ] Reducao significativa de `any` no core DB.
- [ ] Tipos de dominio derivados do schema (fonte unica da verdade).

## 7. Fase 4 - Fixtures, Coerencia de Dados e Duplicacao (P2) (Dias 5-6)

### Objetivo
Eliminar inconsistencias operacionais em seed e testes.

### Checklist

- [ ] Decidir destino de funcoes de fixture nao usadas:
- [ ] Integrar no fluxo de seed, ou
- [ ] Remover do codigo.
- [ ] Garantir que `seedOperationalFixtures` cubra todos os cenarios esperados.
- [ ] Adicionar smoke test de fixture para validar:
- [ ] menus/itens
- [ ] redirects/webhooks
- [ ] media fixture
- [ ] Revisar hook de upload (`use-image-upload`):
- [ ] Remover comportamento de demo aleatorio de ambientes reais.
- [ ] Separar claramente demo mode vs production mode.

### Criterio de saida

- [ ] Fixtures consistentes com testes.
- [ ] Sem comportamento aleatorio em fluxo real.

## 8. Fase 5 - Hardening de Configuracao e Observabilidade (Dias 6-7)

### Objetivo
Impedir regressao de configuracao e melhorar detectabilidade de falhas.

### Checklist

- [ ] Criar validador de configuracao de ambiente no bootstrap:
- [ ] variaveis obrigatorias por ambiente (dev/staging/prod).
- [ ] erro claro e bloqueante para configuracao invalida.
- [ ] Revisar `wrangler.jsonc` e documentar variaveis obrigatorias.
- [ ] Criar checklist de release com gate automatico:
- [ ] lint
- [ ] typecheck
- [ ] testes
- [ ] config validation
- [ ] Melhorar telemetria de erros:
- [ ] padronizar logs estruturados para falhas de integracao.
- [ ] adicionar contexto minimo em erros de API sensiveis.

### Criterio de saida

- [ ] Build falha cedo com configuracao invalida.
- [ ] Pipeline de release com gates automatizados.

## 9. Fase 6 - Fechamento e Governanca Continua (Semana 2)

### Objetivo
Consolidar qualidade e prevenir retorno do problema.

### Checklist

- [ ] Revisao final de seguranca (peer review dedicado).
- [ ] Revisao final de arquitetura/tipagem (peer review dedicado).
- [ ] Atualizar documentacao tecnica:
- [ ] padrao de schemas/tipos
- [ ] politica de env vars
- [ ] padrao para links e redirects
- [ ] Registrar ADRs curtas para decisoes-chave (env, DB typing, redirects).
- [ ] Planejar sprint de melhoria continua para P2 restante.

### Criterio de saida

- [ ] Todas as issues P0 e P1 resolvidas e validadas.
- [ ] Roadmap encerrado com evidencias de qualidade (pipeline verde).

## 10. Definicao de Pronto (Definition of Done)

- [ ] `pnpm run lint` sem erros.
- [ ] `pnpm exec tsc --noEmit` sem erros.
- [ ] Testes unitarios e integracao passando.
- [ ] Testes cobrindo os fixes criticos de seguranca.
- [ ] Sem fallback inseguro em segredos/chaves.
- [ ] Sem endpoints de redirect sem validacao.
- [ ] Tipos de dominio principais derivados de schemas (sem duplicacao manual).

## 11. Sequencia Recomendada de PRs

- [ ] PR 1: Seguranca (redirect + segredos + stripe init + localhost fallback critico).
- [ ] PR 2: Build health (lint + tsc + testes quebrados).
- [ ] PR 3: Tipagem DB + centralizacao de tipos/schema.
- [ ] PR 4: Fixtures e limpeza de duplicacoes/dead code.
- [ ] PR 5: Validacao de env + gates de release + docs.

## 12. Riscos e Mitigacoes

- [ ] Risco: quebrar fluxo de email/stripe ao remover fallback.
- [ ] Mitigacao: feature flags por ambiente + testes de integracao de webhook/checkout.
- [ ] Risco: refactor de tipagem impactar muitas queries.
- [ ] Mitigacao: refatorar por modulo com PRs pequenos e testes incrementais.
- [ ] Risco: regressao em links de newsletter.
- [ ] Mitigacao: testes automatizados de click/open tracking e validacao de URL.

