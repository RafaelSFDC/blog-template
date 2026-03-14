# Backlog De Consistencia

Este backlog deriva diretamente da auditoria tecnica e organiza o trabalho em tres horizontes.

## Corrigir Agora

- padronizar naming de novos arquivos React e registrar a regra no time
- escolher e documentar a estrategia oficial de edicao de conteudo por tipo de entidade
- garantir que `README.md`, `docs/README.md` e `CONTRIBUTING.md` sejam a porta de entrada oficial para manutencao

## Consolidar Em Seguida

- extrair camada compartilhada para create/edit de paginas
- revisar create/edit de posts para confirmar e consolidar duplicacao equivalente
- reforcar a fronteira entre `src/server` e `src/lib`
- padronizar mensagens de erro e idioma por fluxo de UI
- explicitar o que e `core` vs `experimental`
- ampliar setup de testes para componentes administrativos mais ricos

## Refatorar Depois

- simplificar a arquitetura editorial reduzindo sobreposicao entre Tiptap, Puck e camada de preview
- criar uma base administrativa mais padronizada para formularios e CRUDs
- definir estrategia minima de observabilidade operacional
- definir estrategia de backup e restauracao
- ampliar cobertura para integracao e end-to-end em fluxos criticos
