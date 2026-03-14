# Backlog De Consistencia

Este backlog deriva diretamente da auditoria tecnica e organiza o trabalho em tres horizontes.

## Corrigir Agora

- padronizar naming de novos arquivos React e registrar a regra no time
- escolher e documentar a estrategia oficial de edicao de conteudo por tipo de entidade
- garantir que `README.md`, `docs/README.md` e `CONTRIBUTING.md` sejam a porta de entrada oficial para manutencao

## Consolidar Em Seguida

- reforcar a fronteira entre `src/server` e `src/lib`
- explicitar o que e `core` vs `experimental`
- ampliar cobertura de testes para auth publico e componentes administrativos mais ricos
- alinhar as telas administrativas legacy restantes ao padrao atual sem reintroduzir affordances nao implementadas

## Refatorar Depois

- simplificar a arquitetura editorial reduzindo compatibilidades tecnicas desnecessarias ao redor de Tiptap, Puck e camada de preview
- criar uma base administrativa mais padronizada para formularios e CRUDs
- definir estrategia minima de observabilidade operacional
- definir estrategia de backup e restauracao
- ampliar cobertura para integracao e end-to-end em fluxos criticos
