# Contribuindo Para O Lumina

## Antes De Comecar

Leia a documentacao de engenharia em [`docs/README.md`](./docs/README.md).

Arquivos mais importantes para contribuicao:

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/project-structure.md`](./docs/project-structure.md)
- [`docs/conventions.md`](./docs/conventions.md)
- [`docs/testing-quality.md`](./docs/testing-quality.md)
- [`docs/consistency-audit.md`](./docs/consistency-audit.md)

## Regras Minimas

- documentacao de engenharia fica em portugues
- UI publica e administrativa ficam em ingles
- novas features devem respeitar a separacao entre `routes`, `server`, `lib`, `components` e `db`
- codigo experimental nao deve ser adicionado ao core sem rotulo explicito
- mudancas estruturais relevantes devem atualizar a documentacao correspondente em `docs/`
- toda feature relevante deve deixar clara a relacao entre schema, route, action e UI
- posts usam `Tiptap` como fluxo editorial oficial e paginas usam `Puck`

## Checklist Rapido De PR

- a mudanca esta no diretorio certo?
- a validacao esta centralizada no lugar correto?
- os nomes novos seguem o padrao acordado?
- testes ou justificativa de ausencia de testes foram incluidos?
- `pnpm exec tsc --noEmit`, `pnpm lint` e `pnpm test` continuam verdes?
- a documentacao em `docs/` continua correta?
