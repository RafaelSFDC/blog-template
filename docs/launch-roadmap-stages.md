# Estagios de Execucao do Roadmap de Lancamento do Lumina

## Objetivo

Traduzir o roadmap de lancamento em etapas operacionais, priorizadas e executaveis.

Este documento complementa [C:\Users\Win\Documents\GitHub\lumina\docs\launch-roadmap.md](C:\Users\Win\Documents\GitHub\lumina\docs\launch-roadmap.md) e existe para responder uma pergunta pratica:

"o que exatamente vamos construir primeiro, em que ordem, com qual escopo e com qual definicao de pronto?"

## Premissas

- o roadmap principal do produto ja foi concluido
- o Lumina ja tem base editorial, memberships, newsletter, SEO, seguranca e readiness operacional
- o proximo ciclo nao e de fundacao tecnica
- o foco agora e ativacao, conversao, onboarding e lancamento controlado

## Regras Deste Plano

### 1. Cada estagio precisa entregar valor de negocio claro

Nao vamos organizar apenas por area tecnica. Cada estagio precisa mover pelo menos um destes indicadores:

- ativacao
- qualidade da primeira experiencia
- conversao
- capacidade de onboardar clientes
- aprendizado sobre uso real

### 2. Cada estagio precisa ser lancavel por si

Ao final de cada estagio, o produto deve continuar:

- compilando
- operando
- validavel
- com uma melhoria visivel para o objetivo comercial

### 3. O escopo deve ser conservador no inicio

Os primeiros estagios precisam reduzir atrito de entrada. O que nao impacta setup, primeira impressao, conversao ou operacao de primeiros clientes deve esperar.

## Ordem Recomendada

1. Estagio 1 - Setup guiado e onboarding inicial
2. Estagio 2 - Templates e defaults de lancamento
3. Estagio 3 - Superfices comerciais e narrativa do produto
4. Estagio 4 - Instrumentacao e dashboards de ativacao
5. Estagio 5 - Conversao e refinamento de pricing/paywall
6. Estagio 6 - Operacao de beta e customer success inicial
7. Estagio 7 - Migracao e importacao assistida
8. Estagio 8 - Retencao e expansao pos-lancamento

---

## Estagio 1 - Setup Guiado e Onboarding Inicial

## Resumo

Implementar a primeira experiencia administravel do Lumina.

Hoje o maior risco de ativacao nao parece ser falta de feature, e sim falta de direcao para um admin novo. Este estagio existe para fazer o produto dizer:

- onde comecar
- o que e obrigatorio
- o que vem depois
- o que falta para o site estar pronto

## Objetivo principal

Levar um admin do primeiro login ate um site minimamente configurado com menos duvida e menos navegacao aleatoria.

## Entregas obrigatorias

- setup wizard inicial apos primeiro login administrativo
- estado persistido de progresso do setup
- checklist de onboarding no dashboard
- score ou percentual de "setup completeness"
- CTA fortes para:
  - configurar identidade do site
  - publicar primeiro post
  - revisar pricing
  - ligar newsletter
- deteccao de setup incompleto em areas criticas
- recomendacoes contextuais no dashboard inicial

## Passos do setup wizard

### Passo 1. Identidade do site

- nome do blog
- descricao curta
- logo
- cor principal
- estilo base do site

### Passo 2. Dados publicos e SEO basico

- URL principal
- titulo padrao
- descricao padrao
- imagem social padrao
- checagem basica de indexacao

### Passo 3. Monetizacao

- validar configuracao Stripe
- definir se o projeto vai usar memberships agora ou depois
- configurar plano mensal
- configurar plano anual
- revisar pricing page

### Passo 4. Newsletter

- validar remetente
- escolher double opt-in
- revisar copy de subscribe
- marcar newsletter como ativa ou nao

### Passo 5. Conteudo inicial

- gerar conteudo inicial recomendado
- ou pular e iniciar do zero

## Mudancas de produto recomendadas

- um novo card ou area de onboarding no dashboard home
- componente reutilizavel de tarefa de onboarding
- helper central de completude de setup
- status visiveis:
  - not_started
  - in_progress
  - completed

## APIs/interfaces/tipos importantes

- `getSetupProgress()`
- `completeSetupStep(stepId, payload)`
- `skipSetupStep(stepId)`
- `getOnboardingChecklist()`
- `SetupStepStatus`
- `SetupCompletenessResult`

## Testes

- primeiro admin autenticado ve wizard
- admin pode pular passo sem quebrar o fluxo
- checklist reflete o estado real do projeto
- completude muda ao configurar branding, pricing e newsletter
- wizard nao reaparece indevidamente depois de concluido

## Criterio de pronto

- o admin sabe o que fazer nos primeiros minutos
- o dashboard deixa claro o proximo passo recomendado
- existe uma sensacao concreta de progresso rumo ao lancamento

---

## Estagio 2 - Templates e Defaults de Lancamento

## Resumo

Fazer o Lumina ficar bonito e utilizavel mais rapido.

Esse estagio reduz o risco de "produto vazio", "site feio no primeiro uso" e "exige trabalho demais antes de ficar publicavel".

## Objetivo principal

Diminuir o tempo entre setup e uma apresentacao publica convincente.

## Entregas obrigatorias

- templates iniciais de paginas chave
- presets de homepage por tipo de projeto
- blocos de pagina mais orientados a lancamento
- seeds de conteudo melhores
- menus padrao por perfil de site
- placeholders mais profissionais
- defaults melhores de copy e estrutura

## Templates minimos

- home creator/journal
- home magazine/publication
- home premium membership
- about
- contact
- pricing
- welcome post
- newsletter landing page

## Presets de projeto

### Creator

- foco em autor
- destaque para assinatura e newsletter
- homepage mais pessoal

### Magazine

- foco em destaques editoriais
- secoes e categorias
- mais densidade de conteudo

### Premium publication

- foco em memberships
- paywall e beneficios mais visiveis
- maior destaque para pricing

## Mudancas de produto recomendadas

- seletor de preset no setup wizard
- mapeamento entre preset e:
  - homepage
  - menus
  - pricing copy
  - hero inicial
- seeds de paginas baseadas no preset escolhido

## APIs/interfaces/tipos importantes

- `ProjectPreset = "creator" | "magazine" | "premium_publication"`
- `applyProjectPreset(preset)`
- `generateStarterContent(preset)`
- `TemplateDescriptor`

## Testes

- aplicar preset gera estrutura minima esperada
- starter content nao quebra slug nem SEO
- menu padrao e criado corretamente
- projeto novo fica apresentavel sem setup extra grande

## Criterio de pronto

- um projeto novo parece site real mais cedo
- a instalacao inicial transmite valor visual e editorial

---

## Estagio 3 - Superfices Comerciais e Narrativa do Produto

## Resumo

Construir ou refinar as paginas do proprio produto Lumina para venda, beta ou captacao de interesse.

## Objetivo principal

Fazer o valor do Lumina ser entendido rapido por usuarios e clientes potenciais.

## Entregas obrigatorias

- homepage institucional do Lumina
- pagina de pricing do produto Lumina
- pagina "como funciona"
- FAQ comercial
- pagina de casos de uso
- CTA de:
  - beta
  - lista de espera
  - compra
  - demo interest

## Mensagens que precisam ficar claras

- o que o Lumina resolve
- para quem ele serve
- como ele ajuda a publicar e monetizar
- quais problemas ele evita
- por que nao e so mais um blog starter

## Estrutura recomendada da homepage do produto

- hero com proposta clara
- seccao de beneficios
- seccao de comparacao de uso
- casos de uso
- destaque de memberships e newsletter
- prova de capacidade editorial
- CTA final

## APIs/interfaces/tipos importantes

- nao exige muita API nova
- exige principalmente conteudo, copy e estrutura publica

## Testes

- paginas publicas do produto renderizam corretamente
- CTAs principais sao navegaveis e mensuraveis
- pricing do produto nao conflita com pricing de memberships dos sites

## Criterio de pronto

- o valor do Lumina e entendido sem precisar de explicacao manual longa

---

## Estagio 4 - Instrumentacao de Ativacao, Growth e Receita

## Resumo

Criar a camada de medicao que transforma intuicao em decisao.

## Objetivo principal

Medir com clareza:

- ativacao
- onboarding
- conversao
- uso recorrente
- sinal de valor

## Entregas obrigatorias

- taxonomia oficial de eventos
- helper central de tracking
- eventos de onboarding
- eventos de monetizacao
- eventos de newsletter
- eventos de publicacao
- dashboards internos
- view padronizada de funis principais

## Funis obrigatorios

### Funil de ativacao

- signup
- first login
- setup started
- setup completed
- first post published

### Funil de monetizacao

- pricing viewed
- checkout started
- checkout completed
- subscription active
- subscription canceled

### Funil de growth

- newsletter form viewed
- newsletter subscribed
- paywall viewed
- paywall cta clicked
- account upgraded

## APIs/interfaces/tipos importantes

- `trackProductEvent(name, payload)`
- `ProductEventName`
- `ActivationMetrics`
- `RevenueMetrics`
- `GrowthMetrics`

## Testes

- eventos principais disparam uma vez por acao
- propriedades minimas de contexto estao presentes
- dashboards conseguem ser alimentados sem naming inconsistente

## Criterio de pronto

- o time passa a conseguir responder perguntas de crescimento com dados

---

## Estagio 5 - Conversao: Pricing, Paywall e Captura

## Resumo

Refinar as superfices que transformam interesse em assinatura ou email.

## Objetivo principal

Melhorar a taxa de conversao sem reabrir o core de memberships.

## Entregas obrigatorias

- pricing page mais forte
- comparacao clara mensal vs anual
- plano recomendado
- CTAs melhores de assinatura
- variantes de copy no paywall
- blocos de captura de email antes da oferta paga, quando fizer sentido
- account page com foco em retencao e clareza de status

## Areas a revisar

- pricing page
- paywall component
- CTA em posts premium
- CTA em newsletter
- upgrade prompts na conta

## Experimentos recomendados

- anual como plano destacado
- paywall com foco em beneficio
- paywall com foco em exclusividade
- CTA "compare plans" vs "subscribe now"
- captura de email antes do checkout

## APIs/interfaces/tipos importantes

- `PaywallVariant`
- `PricingDisplayVariant`
- `trackPaywallInteraction()`
- configs simples de copy/variant

## Testes

- pricing mostra planos corretamente
- CTA leva ao fluxo certo
- paywall continua respeitando entitlement
- variantes nao quebram SEO nem gating

## Criterio de pronto

- o funil de conversao fica mais claro, mais forte e mais testavel

---

## Estagio 6 - Operacao de Beta e Customer Success Inicial

## Resumo

Preparar o Lumina para o momento em que entram usuarios reais e surgem pedidos, travas e duvidas.

## Objetivo principal

Criar processo, nao improviso, para os primeiros clientes.

## Entregas obrigatorias

- docs de onboarding rapido
- base de conhecimento inicial
- playbook de atendimento beta
- playbook de triagem
- formulario estruturado de feedback
- classificacao de contas/clientes por estagio
- processo minimo de acompanhamento de beta users

## Estados recomendados de conta

- invited
- onboarding
- blocked
- activated
- paying
- at_risk

## Materiais recomendados

- publicar em 30 minutos
- ativar memberships
- ligar newsletter
- preparar launch checklist
- convide sua equipe

## APIs/interfaces/tipos importantes

- pode comecar documental
- se evoluir dentro do produto:
  - `AccountLifecycleStatus`
  - `CustomerFeedbackCategory`
  - `CustomerHealthNote`

## Testes

- foco maior em processo e documentacao do que automacao
- se houver painel interno de acompanhamento, validar estados e filtros

## Criterio de pronto

- o time consegue onboardar beta users com repetibilidade e visibilidade

---

## Estagio 7 - Importacao e Migracao Assistida

## Resumo

Reduzir a barreira de saida da plataforma antiga.

## Objetivo principal

Permitir que blogs pequenos e medios migrem para o Lumina sem projeto manual excessivo.

## Entregas obrigatorias

- importador inicial de WordPress XML
- importador de CSV de subscribers
- importador de markdown/frontmatter
- importacao de categorias, tags e autores basicos
- geracao de redirects de migracao
- checklist de migracao

## Escopo recomendado do importador v1

- posts
- pages
- categories
- tags
- autores basicos
- imagens referenciadas quando viavel

## Fora de escopo neste corte

- temas complexos de WordPress
- plugins
- layouts equivalentes automaticos
- comentarios com fidelidade perfeita

## APIs/interfaces/tipos importantes

- `ImportSource = "wordpress_xml" | "csv_subscribers" | "markdown"`
- `ImportJobStatus`
- `ImportPreviewResult`
- `executeImport()`

## Testes

- importacao nao duplica slug sem regra clara
- redirects sao gerados corretamente
- categorias e tags mapeiam direito
- importacao falha com mensagem util quando arquivo estiver invalido

## Criterio de pronto

- migrar um site pequeno/medio para o Lumina deixa de ser proibitivo

---

## Estagio 8 - Retencao e Expansao Pos-Lancamento

## Resumo

Entrar em fase de aprendizado e crescimento baseado em uso real.

## Objetivo principal

Entender o que gera saude de conta, retencao e oportunidade de expansao.

## Entregas obrigatorias

- health score de projeto
- sinais de risco de abandono
- recomendacoes de proximo passo no dashboard
- relatorios de uso e engajamento por projeto
- backlog guiado por feedback real

## Sinais recomendados de health score

- setup completo
- posts publicados
- newsletter ativa
- subscribers captados
- memberships configurados
- usuarios ativos no dashboard
- campanhas enviadas

## APIs/interfaces/tipos importantes

- `ProjectHealthScore`
- `HealthSignal`
- `NextBestAction`
- `getProjectHealth()`

## Testes

- score responde a estados reais do projeto
- recomendacoes nao entram em conflito com setup ja concluido

## Criterio de pronto

- o produto passa a evoluir por dados de uso e negocio, nao por intuicao isolada

---

## Plano Recomendado de Implementacao

## Bloco 1

- Estagio 1 completo
- parte essencial do Estagio 2
- taxonomia base do Estagio 4

## Bloco 2

- restante do Estagio 2
- Estagio 3
- primeira metade do Estagio 5

## Bloco 3

- restante do Estagio 5
- Estagio 6
- preparacao do Estagio 7

## Bloco 4

- Estagio 7
- Estagio 8
- refinamentos puxados por beta real

## Recomendacao Final

Se eu fosse transformar isso em execucao imediata, comecaria por:

1. Estagio 1 inteiro
2. metade do Estagio 2
3. base do Estagio 4

Porque esse combo entrega junto:

- menos atrito
- melhor primeira impressao
- mais ativacao
- medicao do que acontece em seguida

Esse e o melhor ponto de partida para o proximo ciclo do Lumina.
