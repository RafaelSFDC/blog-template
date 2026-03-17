# Lumina - Roadmap Final PROD (SQLite-Only)

Status: execucao em ordem estrita (Fase 01 -> 10), sem Worker e sem D1.

## Gate Obrigatorio por Fase

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm build`

---

## Fase 01 - Baseline release/versao

- [x] Consolidar `main` como branch operacional unica local.
- [x] Limpar docs com fluxo antigo e padronizar para `main`.
- [x] Definir convencao RC local (`vYYYY.MM.DD-rcN`).
- [x] Definir politica de rollback por tag aprovada anterior.

Criterio de saida:
- [x] Politica documentada e aplicavel.

---

## Fase 02 - Determinismo de build/deps

- [x] Remover dependencias nao deterministicas (`latest`).
- [x] Validar lockfile/install deterministico.
- [x] Definir janela controlada de update de dependencias.

Criterio de saida:
- [x] Build reproduzivel em ambiente limpo.

---

## Fase 03 - Seguranca de borda e segredos

- [x] Auditar secrets obrigatorios por ambiente.
- [x] Revalidar protecao de webhook (assinatura/replay/rejeicao auditada).
- [x] Revalidar superficies de abuso (comentarios/auth).
- [x] Definir checklist de rotacao e incidente.

Criterio de saida:
- [x] Checklist de seguranca aprovado.

---

## Fase 04 - Banco/migracao/restore (SQLite-only)

- [x] Ensaiar migracao em base limpa.
- [x] Ensaiar migracao em base com dados.
- [x] Ensaiar backup/restore real SQLite com evidencias.
- [x] Medir RTO/RPO e atualizar runbook.
- [x] Registrar bloqueio encontrado (`sqlite.db` legado com drift) e mitigacao.

Criterio de saida:
- [x] Restore validado ponta a ponta com evidencia.

---

## Fase 05 - Observabilidade

- [x] Completar logs estruturados faltantes em fluxos criticos.
- [x] Padronizar envelope de evento (`level`, `event`, `timestamp`, `actor`, `entity`, `outcome`).
- [x] Validar contrato `health/readiness/dependencies`.
- [x] Definir severidade e thresholds operacionais MVP.

Criterio de saida:
- [x] Padrao de observabilidade publicado e aplicado no codigo.

---

## Fase 06 - Performance/capacidade

- [x] Baseline de rotas criticas (`/`, `/blog`, `/blog/$slug`, `/rss/xml`, `/sitemap/xml`).
- [x] Validar orcamento minimo e registrar desvios.
- [x] Rodar carga leve/media para leitura publica e fluxo editorial.
- [x] Publicar relatorio de performance.

Criterio de saida:
- [x] Orcamento atendido no baseline local.

---

## Fase 07 - Qualidade pre-lancamento

- [x] `lint`, `typecheck`, `test`, `build`.
- [x] `test:smoke`.
- [x] `test:e2e`.
- [x] Corrigir flakiness critica identificada no setup e2e.
- [x] Congelar RC tecnico local.

Criterio de saida:
- [x] Pipeline final verde sem rerun manual compensatorio.

---

## Fase 08 - Operacao pratica

- [x] Simular incidente SEV-1 e registrar tempo.
- [x] Simular rollback para release anterior (snapshot SQLite) e validar saude.
- [x] Simular retorno (restore do estado pre-drill) e validar saude.
- [x] Consolidar relatorio do drill.

Criterio de saida:
- [x] Drill operacional executavel sem improviso.

---

## Fase 09 - Go/No-Go

- [x] Consolidar evidencias por fase.
- [x] Revisar riscos residuais e mitigacoes.
- [x] Emitir decisao formal GO/NO-GO.
- [x] Registrar responsaveis por area.

Criterio de saida:
- [x] Ata tecnica de liberacao emitida.

---

## Fase 10 - Pos-go-live (24h/72h)

- [x] Publicar checklist operacional 24h/72h.
- [x] Definir datas absolutas de acompanhamento:
  - 24h: `2026-03-18`
  - 72h: `2026-03-20`
- [x] Semear backlog de hardening pos-lancamento.

Criterio de saida:
- [x] Plano operacional de acompanhamento publicado.

---

## Matriz de Bloqueio

- [x] Nenhuma regressao critica sem mitigacao.
- [x] Restore/migracao com evidencia real.
- [x] Observabilidade minima de fluxos criticos.
- [x] Smoke/e2e do caminho principal validados.
- [x] Riscos residuais registrados no GO/NO-GO.
