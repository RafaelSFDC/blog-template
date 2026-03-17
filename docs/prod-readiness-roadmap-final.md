# Lumina - Roadmap Final de Preparacao para Producao

Status base: MVP funcional concluido em `main`.
Objetivo: elevar de MVP/beta para operacao de producao com controle de risco.
Regra: execucao estrita por fase, sem pular etapa.

## Gate obrigatorio por fase

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

---

## Fase 01 - Baseline de release e controle de versao

- [ ] Definir `main` como unica branch de entrega local.
- [ ] Remover referencias de fluxo antigo em documentacao (branches `codex/*`, `master`).
- [ ] Garantir versao de release candidate (tag local + changelog da release).
- [ ] Travar politica de rollback por versao.

Criterio de saida:
- [ ] Estrategia de release/rollback documentada e validada.

---

## Fase 02 - Determinismo de build e dependencias

- [ ] Revisar dependencias com risco de variacao (ex.: `latest`).
- [ ] Substituir dependencias nao deterministicas por versoes fixas.
- [ ] Validar install deterministico com lockfile.
- [ ] Atualizar politica de atualizacao de dependencias (janela controlada).

Criterio de saida:
- [ ] Build reproduzivel em ambiente limpo.

---

## Fase 03 - Seguranca de borda e segredos

- [ ] Auditar configuracao de segredos obrigatorios por ambiente.
- [ ] Validar protecao de webhook (assinatura, replay, expiracao, auditoria).
- [ ] Revisar superficie de abuso em comentarios/autenticacao.
- [ ] Definir matriz de rotacao de secrets e resposta a incidente.

Criterio de saida:
- [ ] Checklist de segredos e politicas de resposta aprovado.

---

## Fase 04 - Banco, migracoes e restauracao real

- [ ] Validar migracoes em base limpa e base com dados.
- [ ] Executar ensaio real de restore SQLite local.
- [ ] Executar ensaio operacional do caminho D1 restore.
- [ ] Medir RTO/RPO e registrar no runbook.

Criterio de saida:
- [ ] Restore validado ponta a ponta com evidencia.

---

## Fase 05 - Observabilidade de producao

- [ ] Padronizar logs estruturados faltantes nos fluxos criticos (auth, editorial, media, comments, webhook).
- [ ] Integrar coleta central de logs/erros.
- [ ] Definir alertas por severidade (SEV-1/SEV-2/SEV-3) com canal de acionamento.
- [ ] Validar health/readiness/dependencies em ambiente alvo.

Criterio de saida:
- [ ] Alertas disparando corretamente em teste controlado.

---

## Fase 06 - Performance e capacidade

- [ ] Baseline de performance para `/`, `/blog`, `/blog/$slug`, `/rss.xml`, `/sitemap.xml`.
- [ ] Validar orcamento de performance com margem de degradacao aceitavel.
- [ ] Teste de carga para leitura publica e operacoes editoriais criticas.
- [ ] Ajustar queries quentes e caching conforme resultado.

Criterio de saida:
- [ ] Orcamento de performance atendido com relatorio.

---

## Fase 07 - Qualidade de pre-lancamento

- [ ] Rodar suite completa (`lint`, `typecheck`, `test`, `build`, `test:smoke`).
- [ ] Rodar `test:e2e` do caminho critico de negocio.
- [ ] Resolver instabilidades/flakiness antes do go/no-go.
- [ ] Congelar release candidate final.

Criterio de saida:
- [ ] Pipeline final 100% verde sem reexecucao manual.

---

## Fase 08 - Operacao e runbook pratico

- [ ] Executar simulacao de incidente (SEV-1) com triagem e comunicacao.
- [ ] Executar simulacao de rollback com validacao de saude pos-retorno.
- [ ] Validar procedimento de manutencao emergencial.
- [ ] Confirmar ownership e escala de plantao para lancamento.

Criterio de saida:
- [ ] Time apto para operar incidente sem improviso.

---

## Fase 09 - Go/No-Go de producao

- [ ] Consolidar evidencias tecnicas por fase.
- [ ] Revisar riscos residuais e plano de mitigacao.
- [ ] Emitir decisao formal de `GO` ou `NO-GO`.
- [ ] Registrar plano de acompanhamento das primeiras 24h.

Criterio de saida:
- [ ] Ata de liberacao assinada com responsaveis e riscos aceitos.

---

## Fase 10 - Acompanhamento pos-go-live (24h/72h)

- [ ] Monitorar erros, latencia, fila de moderacao e webhooks.
- [ ] Rodar checklist de estabilidade em 24h.
- [ ] Rodar checklist de estabilidade em 72h.
- [ ] Abrir backlog de pos-lancamento com prioridade.

Criterio de saida:
- [ ] Operacao estavel e backlog de melhorias priorizado.

---

## Matriz de bloqueio

Nao avancar de fase se algum item abaixo ocorrer:

- [ ] Regressao funcional critica sem hotfix validado.
- [ ] Falha em restore/migracao sem plano comprovado.
- [ ] Falha em alertas/observabilidade de fluxo critico.
- [ ] Falha em smoke/e2e de caminho principal.
- [ ] Risco de seguranca sem mitigacao.
