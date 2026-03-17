# Sprint 1 - Relatorio de Validacao P0

Data: 17 de marco de 2026

## 1) Escopo concluido

- [x] PR-01: Seguranca de redirect em `/api/newsletter/click`
- [x] PR-02: Segredo de newsletter sem fallback inseguro em `staging/prod`
- [x] PR-03: Hardening de `STRIPE_SECRET_KEY` com falha cedo em `staging/prod`
- [x] PR-04: Remocao de fallback `localhost` para fluxos externos sensiveis em `staging/prod`
- [x] PR-05: Gate de qualidade da sprint executado e aprovado

## 2) Mudancas implementadas

- Endpoint de click de newsletter agora valida `url` e retorna `400` para destino inseguro/invalido.
- Novo helper centralizado de ambiente/config:
  - `getRuntimeEnvironment`
  - `isStrictEnvironment`
  - `resolveExternalBaseUrl`
  - `resolveNewsletterTokenSecret`
  - `resolveStripeSecretKey`
- Fluxos que geram URLs externas agora usam resolução centralizada:
  - convites (`BETTER_AUTH_URL`)
  - checkout e billing portal (`APP_URL`)
  - links de newsletter (`siteUrl` configurado ou `APP_URL`)
- Removido fallback inseguro de segredo de newsletter em ambientes estritos.
- `stripe` passa a exigir `STRIPE_SECRET_KEY` em `staging/prod`.

## 3) Evidencias de testes e quality gate

- [x] `pnpm run lint`
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm run test:unit`
- [x] `pnpm run test:integration`

### Cobertura adicionada/ajustada

- Testes do endpoint de click de newsletter:
  - redirect seguro
  - bloqueio de URL insegura
- Testes de runtime/config:
  - exigencia de env em ambientes estritos
  - fallback controlado em dev/test
  - exigencia de segredos/chaves em estrito
- Ajustes de testes de integracao e tipagem para manter pipeline verde.

## 4) Arquivos-chave alterados

- `src/routes/api/newsletter/click.ts`
- `src/server/newsletter-campaigns.ts`
- `src/server/stripe.ts`
- `src/server/membership-actions.ts`
- `src/server/invitation-actions.ts`
- `src/server/system/runtime-config.ts`
- `src/routes/api/newsletter/click.test.ts`
- `src/server/system/runtime-config.test.ts`

## 5) Resultado final

- [x] P0 entregue com foco em seguranca e configuracao.
- [x] Build e testes verdes.
- [x] Projeto pronto para iniciar P1 (tipagem/core e coesao de schema) sem pendencias bloqueadoras do Sprint 1.

