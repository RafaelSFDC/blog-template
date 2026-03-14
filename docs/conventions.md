# Convencoes Do Projeto

## Principios

- refletir o estado real do produto
- reduzir ambiguidade arquitetural
- manter previsibilidade para quem entra no codigo
- evitar espalhar a mesma regra em varias camadas

## Idioma

### Documentacao

- idioma padrao: portugues

### Codigo

- nomes de simbolos, tipos, props e funcoes: ingles
- comentarios tecnicos: preferencialmente ingles ou portugues simples, desde que consistentes no arquivo

### UI

Politica atual:

- a interface administrativa e publica usa ingles como idioma principal
- nao misturar labels, CTA, placeholders e mensagens de erro em mais de um idioma no mesmo fluxo

Regra pratica:

- novas telas e componentes visiveis ao usuario devem usar ingles
- qualquer excecao deve ser intencional e documentada

## Naming

### Arquivos React

Padrao oficial recomendado:

- componentes React: `kebab-case.tsx`
- arquivos de teste: `nome-do-arquivo.test.ts(x)`
- hooks: `use-*.ts`

Estado atual:

- existe mistura de `PascalCase`, `kebab-case` e arquivos com prefixo `demo.`

Politica:

- novas adicoes devem seguir um padrao unico
- ao tocar em areas antigas, preferir renomear somente se houver ganho claro e baixo risco
- codigo experimental deve ser nomeado de forma explicita e isolado do core

## Componentes

### `components/ui`

Usar apenas para:

- primitives
- wrappers de biblioteca
- componentes agnosticos de dominio

Nao usar para:

- regras do dashboard
- widgets editoriais especificos
- fluxos de CMS

### `components/dashboard`

Usar para:

- layout do painel
- tabelas administrativas
- previews editoriais
- componentes acoplados a operacao interna

### `components/cms`

Usar para:

- edicao visual de paginas
- renderizacao de pagina CMS
- builder configuration baseada em Puck

### `components/blog`

Usar para:

- cards, newsletter, paywall, comentarios e elementos da experiencia publica editorial

## Server Functions E Dominio

- rotas nao devem carregar logica pesada de negocio
- `src/server` e a camada preferencial para casos de uso
- `src/lib` deve manter helpers puros, validacoes e integracoes compartilhadas
- se uma regra precisa de persistencia + validacao + efeito colateral, ela provavelmente pertence a `src/server`

## Schemas E Status

- todo status de entidade deve nascer de uma constante compartilhada + schema Zod
- UI, route e server action devem consumir a mesma fonte de verdade
- nao criar enums ad hoc por tela quando o sistema ja tiver um schema oficial

Estado atual:

- posts e pages ja seguem essa direcao via `cms-schema.ts`

## Formularios

- usar TanStack Form para formularios novos na app
- validacao principal via Zod
- sanitizacao leve antes do envio e permitida, mas a validacao final deve acontecer na camada server
- formularios relevantes devem deixar claro:
  - estado inicial
  - schema
  - submit
  - mensagens de erro

## Convencao Editorial

Politica oficial do produto:

- posts usam `Tiptap` para escrita editorial
- paginas usam `Puck` para composicao estrutural

Interpretacao correta:

- nao sao duas solucoes concorrentes para o mesmo fluxo
- sao ferramentas complementares para entidades diferentes

Quando houver compatibilidade tecnica com formatos antigos:

- documentar como compatibilidade de implementacao
- nao apresentar isso como estrategia editorial principal

## Mensagens De Erro

Padrao recomendado:

- mensagens de erro tecnicas do backend em ingles ou neutras para logs
- mensagens de UI em um unico idioma por tela
- erros de banco ou integracao nao devem vazar detalhes desnecessarios para o usuario

Estado atual:

- ja existe helper para erros amigaveis em `getFriendlyDbError`
- ainda ha inconsistencias de idioma e tom nas telas

## Hooks

- hooks em `src/hooks` devem ser reutilizaveis e com responsabilidade clara
- hooks experimentais ou de demo nao devem ficar misturados ao core sem rotulo explicito
- evitar hooks que escondam logica de dominio dificil de rastrear

## Testes

- utilitarios puros: testes em `src/lib/*.test.ts`
- dominio: testes em `src/server/*.test.ts`
- componentes: testes apenas quando o comportamento justificar
- componentes dependentes de APIs do browser devem declarar mocks/setup necessarios

Politica formal:

- se um componente usa APIs como `ResizeObserver`, `IntersectionObserver`, drag-and-drop ou editor complexo, o setup de teste deve cobrir isso antes de o teste entrar na suite principal

## Theming E i18n

- theming deve passar por configuracao global e classes do tema
- i18n deve usar Paraglide como referencia para localizacao
- novas features nao devem criar uma segunda infraestrutura de localizacao

## Analytics

- tracking deve passar por uma camada identificavel e previsivel
- evitar eventos espalhados sem naming consistente
- eventos novos devem registrar:
  - nome do evento
  - momento em que disparam
  - propriedades principais

## Experimental Vs Core

Politica oficial:

- codigo `core` e o que compoe fluxos ativos do produto
- codigo `experimental` e o que ainda nao faz parte do fluxo oficial, ou serve a demos/prototipos

Codigo experimental:

- nao deve parecer parte do core sem indicacao explicita
- deve viver preferencialmente em area dedicada
- deve ser documentado como experimental enquanto nao for removido ou consolidado
