# Engenharia Do Lumina

Este diretorio concentra a documentacao de engenharia do Lumina. A ideia aqui e manter uma fonte de verdade para arquitetura, convencoes, fluxos, operacao e qualidade do projeto, separada da documentacao mais geral do produto.

## Como Navegar

- [`architecture.md`](./architecture.md): visao de arquitetura, runtime, entrypoints e integracoes principais
- [`project-structure.md`](./project-structure.md): mapa das pastas e regras de organizacao do repositorio
- [`conventions.md`](./conventions.md): convencoes oficiais de naming, responsabilidade, idioma e padroes de implementacao
- [`flows.md`](./flows.md): fluxos principais do sistema, da entrada ate persistencia e efeitos colaterais
- [`operations.md`](./operations.md): setup local, bancos suportados, storage, scripts, deploy e operacao
- [`testing-quality.md`](./testing-quality.md): estado atual da suite, lacunas e criterios minimos de qualidade
- [`consistency-audit.md`](./consistency-audit.md): auditoria tecnica com problemas concretos encontrados no codigo atual
- [`consistency-backlog.md`](./consistency-backlog.md): backlog acionavel derivado da auditoria

## Contexto De Produto

Os documentos abaixo continuam sendo a referencia de produto e estrategia:

- [`vision.md`](./vision.md)
- [`current-state.md`](./current-state.md)
- [`roadmap.md`](./roadmap.md)

## Politicas Deste Diretorio

- Esta e a documentacao principal de engenharia do projeto.
- O idioma padrao aqui e portugues.
- Os documentos devem refletir o estado real do codigo, nao o estado desejado.
- Quando o projeto estiver parcialmente implementado, a documentacao deve registrar isso explicitamente.
- Toda mudanca estrutural relevante no repositorio deve ser acompanhada por atualizacao neste diretorio.
