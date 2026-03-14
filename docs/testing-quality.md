# Testes E Qualidade

## Visao Geral

O projeto usa:

- Vitest
- ambiente `jsdom`
- ESLint

O objetivo desta pagina e registrar a cobertura atual e os criterios minimos para novas features.

## Suite Atual

Comando:

```bash
pnpm test
```

Estado observado na auditoria:

- suite estabilizada com setup global de browser APIs para o ambiente `jsdom`
- a falha anterior ligada a `ResizeObserver` deixou de ser um bloqueio estrutural da suite

Historico relevante:

- `src/components/dashboard/editorial-preview.test.tsx`
- antes falhava com `ResizeObserver is not defined`

Leitura:

- o projeto agora possui setup global para APIs recorrentes de browser exigidas por componentes editoriais
- ainda assim, componentes dependentes de bibliotecas de editor e drag-and-drop continuam sendo uma area que merece atencao especial

## Lint

Comando:

```bash
pnpm lint
```

Estado observado na auditoria:

- baseline de erros de lint ligada a imports mortos foi corrigida
- permanecem warnings em `worker-configuration.d.ts`

## O Que Esta Coberto

Areas com testes identificados:

- schema CMS
- SEO
- paginacao
- storage
- settings form helpers
- editorial form helpers
- preview editorial helper
- comentarios no dominio
- dominio de posts
- busca de posts
- utilitarios de Puck

## O Que Ainda Nao Esta Bem Coberto

- fluxos completos do dashboard
- integracao entre route, action e banco
- auth end-to-end
- comentarios end-to-end
- newsletter end-to-end
- assinatura Stripe end-to-end
- publicacao agendada end-to-end
- componentes que dependem de APIs de browser mais ricas
- fluxos completos de auth publico
- formularios administrativos mais complexos em nivel de componente

## Criterios Minimos Para Novas Features

### Quando adicionar teste unitario

- schema novo
- helper puro novo
- regra de negocio nova em `src/server`
- logica de validacao de status, slug, SEO ou permissions
- normalizadores de formulario e adaptadores `view-model -> payload`

### Quando adicionar teste de componente

- o componente tem comportamento condicional relevante
- o componente e parte critica do dashboard
- o componente encapsula UX importante alem de renderizacao simples

### Quando reforcar setup de ambiente

- a feature depende de APIs do browser como `ResizeObserver`
- a feature depende de drag-and-drop, rich text editor ou observers
- o teste quebra fora do browser real

### Regra minima para merge

- feature critica nao deve entrar sem algum teste no nivel adequado
- se nao houver teste, a razao deve ser clara e temporaria
- docs e quality notes devem ser atualizados quando o comportamento mudar

## Checklist Rapido Para PRs

- schema e validacao foram cobertos?
- regra de negocio nova foi testada?
- mensagens de erro e estados invalidos foram exercitados?
- se houver dependencia de APIs do browser, o setup de teste foi ajustado?
- a documentacao em `docs/` continua correta?
