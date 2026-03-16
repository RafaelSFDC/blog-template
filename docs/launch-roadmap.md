# Roadmap Canonico de Launch do Lumina

## Objetivo

Este documento e a fonte canonica do roadmap de launch do Lumina.

Ele consolida em um unico lugar:

- a definicao de launch controlado v1
- as regras de prioridade e classificacao
- a sequencia oficial das fases
- os gates de passagem
- os checklists de execucao
- os itens que continuam depois do launch

O objetivo deste arquivo e permitir que produto, engenharia, operacao e go-to-market usem a mesma referencia para decidir o que entra em `now`, o que fica em `next` e o que deve esperar em `later`.

## Publico-alvo

Este documento foi escrito para:

- fundadores e product owners definirem prioridade
- engenharia alinhar escopo, ordem e dependencias
- operacao organizar onboarding, suporte inicial e readiness de release
- go-to-market entender o que precisa existir antes de ampliar beta e primeiros clientes pagantes

## O que significa "launch controlado v1"

Para o Lumina, "launch controlado v1" significa:

- beta estruturado com onboarding repetivel
- capacidade de levar um admin novo do zero a um site configurado sem ajuda de engenharia
- experiencia inicial forte o bastante para o produto nao parecer vazio
- superfices comerciais claras para captar interesse, beta requests e primeiros clientes pagantes
- instrumentacao minima para medir ativacao, conversao, newsletter e revenue
- processo minimo de release, smoke check, suporte inicial e consolidacao de feedback

Nao significa concluir toda a visao do produto. Importacao ampla, health score sofisticado, expansao e backlog profundo de retencao continuam importantes, mas nao bloqueiam o launch controlado v1.

## Status oficiais deste roadmap

Todo item, fase ou iniciativa referenciado a partir deste documento deve usar um destes status:

- `now`: obrigatorio para o launch controlado v1 e com prioridade ativa
- `next`: importante logo apos o launch ou assim que um gate atual fechar
- `later`: relevante para a visao do produto, mas fora da janela de decisao do ciclo atual

Regra pratica:

- `now` bloqueia launch se nao estiver pronto
- `next` nao bloqueia launch, mas compoe a fila imediata seguinte
- `later` nao entra no escopo de decisao do ciclo atual

## O que e "launch-ready"

Consideramos o Lumina pronto para o launch controlado v1 quando todos os pontos abaixo estiverem atendidos:

- um admin novo sai do primeiro login para um site minimamente configurado sem ajuda manual
- o projeto novo deixa de parecer plataforma vazia logo apos o setup
- o valor do proprio Lumina esta claro nas superfices comerciais
- os principais pontos do funil visitante -> subscriber -> paid estao instrumentados
- existe processo minimo para onboarding, suporte inicial, triagem e feedback de beta users
- o time consegue executar release, smoke check e rollback com um procedimento definido

Os itens abaixo continuam importantes, mas nao sao bloqueadores deste launch:

- importadores completos de migracao
- health score sofisticado de projeto
- expansao orientada por sinais de conta
- backlog amplo de retencao e maturidade pos-launch

## Principios de priorizacao

- priorizar ativacao, conversao e clareza comercial acima de novas frentes de fundacao
- reduzir tempo ate primeiro valor como KPI principal do ciclo
- instrumentar antes de escalar aquisicao
- evitar backlog que parece valioso, mas nao melhora setup, conversao, operacao ou capacidade de medir
- tratar implementado como insuficiente ate estar validado, medivel e compreensivel para o time
- manter o escopo do launch focado em beta estruturado e primeiros clientes pagantes

## Gate de passagem

"Gate de passagem" e o criterio oficial para encerrar uma fase e iniciar a proxima.

Uma fase so pode ser considerada concluida quando:

- as entregas minimas da fase existem
- o comportamento principal foi validado
- os eventos relevantes foram instrumentados quando aplicavel
- o time consegue explicar o que mudou, o que ficou de fora e o que ainda representa risco

Codigo implementado sem validacao, medicao ou entendimento compartilhado nao fecha fase.

## Sequencia ponta a ponta

### Leitura rapida da sequencia

Fases que bloqueiam o launch controlado v1:

1. Fase 1 - Ativacao e first-run experience
2. Fase 2 - Time-to-beauty e proposta inicial de valor
3. Fase 3 - Superficies comerciais e conversao inicial
4. Fase 4 - Instrumentacao e governanca de decisao
5. Fase 5 - Operacao minima de launch

Fases de continuidade pos-launch:

6. Fase 6 - Conversao avancada: pricing, paywall e captura
7. Fase 7 - Migracao e importacao assistida
8. Fase 8 - Retencao e expansao pos-launch

## Fase 1 - Ativacao e first-run experience

**Status:** `now`
**Gate status:** completed on March 16, 2026

**Objetivo**

Levar um admin novo do primeiro login ate um projeto minimamente configurado com pouca duvida, pouca navegacao aleatoria e clareza sobre o que e obrigatorio para avancar.

**Por que isso importa**

Sem uma first-run forte, o produto parece mais complexo do que realmente e trava a ativacao antes mesmo de o usuario avaliar valor.

**Escopo da fase**

- setup wizard para admins no primeiro acesso
- progresso persistido do setup
- checklist de onboarding no dashboard
- score ou status de completude do setup
- recomendacao objetiva de proximo passo no dashboard
- deteccao de setup incompleto em areas criticas

**Entregas obrigatorias**

- wizard inicial apos primeiro login administrativo
- checklist de onboarding no dashboard
- helper central de completude de setup
- estados visiveis `not_started`, `in_progress` e `completed`
- CTA fortes para identidade, pricing, newsletter e primeiro conteudo
- comportamento consistente para `admin` e `superAdmin`

**Checklist de execucao**

- [x] primeiro admin autenticado ve o wizard no momento correto
- [x] wizard e checklist refletem o mesmo estado sem ambiguidade
- [x] proximo passo do dashboard bate com o bloqueio real do setup
- [x] admin pode concluir ou pular passo sem quebrar o fluxo
- [x] o wizard nao reaparece indevidamente depois de concluido
- [x] reabrir o setup nao cria estado quebrado
- [x] o time consegue testar o fluxo principal sem intervencao manual

**Dependencias**

- helper central de completude
- permissao correta para `admin` e `superAdmin`
- base de settings, dashboard e criacao de paginas ja existente

**Gate de passagem**

- um admin novo entende o que fazer nos primeiros minutos
- o dashboard mostra o proximo passo de forma objetiva
- o estado refletido no produto bate com o checklist exibido
- o fluxo principal pode ser validado de ponta a ponta sem ajuda manual

**Fora de escopo**

- health score sofisticado
- onboarding avancado de equipe multiusuario
- expansoes que nao reduzam diretamente o tempo ate primeiro valor

## Fase 2 - Time-to-beauty e proposta inicial de valor

**Status:** `now`
**Gate status:** completed on March 16, 2026

**Objetivo**

Fazer um projeto novo parecer um site real, intencional e publicavel logo apos o setup inicial.

**Por que isso importa**

Mesmo quando o setup funciona, um site vazio ou improvisado reduz percepcao de valor, enfraquece demos e derruba conversao.

**Escopo da fase**

- presets globais por tipo de projeto
- templates minimos para paginas essenciais
- starter content e copy coerentes com o preset escolhido
- menus, heroes e placeholders mais profissionais
- resultado publico consistente entre dashboard, paginas criadas e homepage fallback

**Entregas obrigatorias**

- seletor de preset no setup wizard ou ponto equivalente do fluxo inicial
- presets `creator`, `magazine` e `premium_publication`
- templates minimos para home, about, contact, pricing, welcome post e newsletter landing
- starter content seguro para reexecucao
- mapeamento claro entre preset e hero, menus, pricing copy e paginas base

**Checklist de execucao**

- [x] aplicar preset gera estrutura minima esperada
- [x] starter content nao cria duplicacao indevida
- [x] paginas essenciais saem do setup com expectativa clara de revisao
- [x] menu padrao e criado corretamente
- [x] homepage fallback e paginas criadas apontam para a mesma direcao editorial
- [x] projeto novo parece intencional mesmo antes de customizacao profunda
- [x] o admin nao precisa montar as paginas centrais do zero

**Dependencias**

- conclusao funcional da Fase 1
- capacidade de gerar paginas base e drafts com seguranca
- biblioteca atual de blocos e CMS/Puck como base de template

**Gate de passagem**

- um projeto novo parece um site real sem customizacao extensa
- o preset escolhido produz uma direcao visual e editorial clara
- reexecutar setup ou starter content nao quebra o estado do projeto

**Fora de escopo**

- sistema de theming profundo
- reconstrucao ampla de editor
- backlog de layout altamente customizavel

## Fase 3 - Superficies comerciais e conversao inicial

**Status:** `now`
**Gate status:** completed on March 16, 2026

**Objetivo**

Fazer o Lumina se explicar rapido e reduzir friccao nas superfices que transformam interesse em beta request, subscriber ou paid.

**Por que isso importa**

O produto pode estar forte tecnicamente e ainda assim falhar comercialmente se narrativa, CTA e pricing nao forem claros.

**Escopo da fase**

- namespace comercial `/lumina` com shell proprio
- landing principal do produto
- pagina de pricing do proprio Lumina
- pagina how it works
- FAQ comercial
- pagina de casos de uso ou paginas por ICP principal
- fluxo de beta request reaproveitando o pipeline existente
- CTA secundarios de pricing e how it works coerentes com o funil beta-first

**Entregas obrigatorias**

- homepage institucional do Lumina
- pricing page do produto
- pagina "como funciona"
- FAQ comercial
- pagina de casos de uso
- CTA de beta request como principal caminho comercial da fase
- CTA secundarios de pricing e how it works
- melhoria da pricing publica, paywall e CTAs centrais do funil inicial

**Checklist de execucao**

- [x] um visitante entende em poucos segundos para quem o Lumina serve
- [x] a proposta de valor fica clara sem explicacao manual longa
- [x] os CTAs principais estao consistentes e navegaveis
- [x] pricing e paywall deixam claro o proximo passo comercial
- [x] a narrativa diferencia Lumina de um blog starter generico
- [x] as paginas publicas do produto renderizam corretamente

**Dependencias**

- clareza de ICP e proposta de valor do launch
- base publica estavel para rotas institucionais
- eventos definidos para CTA e beta request

**Gate de passagem**

- o valor do produto e entendido com rapidez
- os CTAs principais estao alinhados com o funil desejado
- pricing, beta request e proximo passo comercial nao entram em conflito

**Fora de escopo**

- reabertura da arquitetura completa de memberships
- experimentacao comercial extensa sem baseline clara
- expansao para multiplos segmentos fora do ICP principal

## Fase 4 - Instrumentacao e governanca de decisao

**Status:** `now`
**Gate status:** completed on March 16, 2026

**Objetivo**

Dar ao time uma camada confiavel para medir ativacao, conversao, newsletter e receita durante o launch.

**Por que isso importa**

Sem taxonomia e leituras consistentes, o time nao consegue diferenciar friccao real de impressao subjetiva.

**Escopo da fase**

- catalogo oficial de eventos
- helpers centralizados de captura client e server
- cobertura dos funis principais
- dashboard interno organizado por perguntas de produto
- leituras minimas de 7d, 30d e 90d

**Entregas obrigatorias**

- taxonomia oficial de eventos adotada como referencia unica
- helper central de tracking
- eventos canonicos para onboarding, marketing, newsletter, monetizacao e publicacao
- dual-write temporario apenas onde necessario
- visao padronizada dos funis de ativacao, growth e revenue

**Checklist de execucao**

- [x] eventos principais disparam uma vez por acao
- [x] propriedades minimas de contexto estao presentes
- [x] o time consegue identificar onde o setup trava
- [x] o time consegue enxergar queda em checkout e subscribe
- [x] dashboards internos respondem perguntas reais de produto
- [x] naming inconsistente deixa de contaminar as leituras principais

**Dependencias**

- fluxos principais das Fases 1 e 3 definidos
- PostHog e pipeline atual em estado utilizavel
- alinhamento entre eventos novos e consultas do dashboard

**Gate de passagem**

- as rotas criticas disparam eventos com consistencia
- o time consegue responder perguntas basicas de ativacao e conversao com dados
- as leituras principais deixam de depender de intuicao ou analise manual dispersa

**Fora de escopo**

- analytics perfeito ou exaustivo
- dashboards altamente customizados por area
- proliferacao de eventos sem governanca

## Fase 5 - Operacao minima de launch

**Status:** `now`

**Objetivo**

Trocar improviso por um processo minimo de beta, release e suporte inicial para os primeiros usuarios reais.

**Por que isso importa**

Sem operacao minima, qualquer problema de onboarding, billing ou release vira gargalo manual e reduz confianca para abrir o produto.

**Escopo da fase**

- playbook de onboarding de beta users
- base de conhecimento inicial
- templates de resposta e triagem
- classificacao minima de contas ou casos
- checklist de release e smoke checks usados como procedimento real
- rotina basica de feedback e consolidacao de aprendizados

**Entregas obrigatorias**

- docs de onboarding rapido
- base de conhecimento inicial para tarefas recorrentes
- playbook de atendimento beta
- playbook de triagem inicial
- formulario ou estrutura minima de feedback
- classificacao de contas por estagio operacional
- procedimento real de pre-release, release e rollback

**Checklist de execucao**

- [ ] o time consegue onboardar beta users com repetibilidade
- [ ] existe procedimento minimo para onboarding, billing e publish
- [ ] feedback chega em formato classificavel e acionavel
- [ ] a release pode ser validada antes e depois do deploy
- [ ] smoke checks e rollback deixam de depender de memoria individual
- [ ] os problemas mais comuns possuem resposta minima documentada

**Dependencias**

- superfices principais do produto ja utilizaveis
- runbooks e checklist de release existentes como ponto de partida
- capacidade minima de observacao de incidentes e falhas criticas

**Gate de passagem**

- o time sabe como onboardar, validar release e responder aos casos mais comuns
- problemas criticos de onboarding ou billing deixam de ser improvisados
- o produto fica operacionalmente apto para o launch controlado v1

**Fora de escopo**

- customer success altamente automatizado
- painel sofisticado de health score
- operacao enterprise ou suporte multi-tier

## Fase 6 - Conversao avancada: pricing, paywall e captura

**Status:** `next`

**Objetivo**

Refinar as superfices que transformam interesse em assinatura ou email sem reabrir o core de memberships.

**Por que isso importa**

Depois que o launch estiver em pe, esta e a alavanca mais direta para melhorar eficiencia de aquisicao e receita inicial.

**Escopo da fase**

- pricing page mais forte
- comparacao clara mensal vs anual
- plano recomendado
- variantes de copy no paywall
- blocos de captura de email antes da oferta paga quando fizer sentido
- account page com foco em clareza de status e retencao

**Entregas obrigatorias**

- refinamento de pricing do produto e de memberships
- CTAs melhores de assinatura
- variantes simples e testaveis de paywall
- prompts de upgrade na conta
- eventos especificos de interacao com pricing e paywall

**Checklist de execucao**

- [ ] pricing mostra planos corretamente
- [ ] CTA leva ao fluxo certo
- [ ] paywall continua respeitando entitlement
- [ ] variantes nao quebram SEO nem gating
- [ ] o funil de conversao fica mais claro e mais testavel

**Dependencias**

- baseline de conversao das Fases 3 e 4
- superfices publicas estaveis
- core de memberships suficientemente confiavel para iteracao de copy e UX

**Gate de passagem**

- o time consegue testar e comparar variacoes de pricing ou paywall sem reabrir a fundacao
- as principais superficies de conversao ficam mensuraveis e iteraveis

**Fora de escopo**

- reconstruir memberships do zero
- programa amplo de experimentacao sem baseline
- customizacao excessiva de planos antes de validacao comercial

## Fase 7 - Migracao e importacao assistida

**Status:** `next`

**Objetivo**

Reduzir a barreira de saida da plataforma antiga e permitir migracao viavel para blogs pequenos e medios.

**Por que isso importa**

Depois do launch, importacao passa a ser uma alavanca importante para aquisicao e diminuicao de atrito comercial.

**Escopo da fase**

- importador inicial de WordPress XML
- importador de CSV de subscribers
- importador de markdown/frontmatter
- importacao de categorias, tags e autores basicos
- geracao de redirects de migracao
- checklist de migracao

**Entregas obrigatorias**

- suportar ao menos uma rota viavel de importacao editorial
- suportar importacao basica de subscribers
- suportar preview ou validacao minima do import
- gerar redirects em casos esperados de migracao
- documentar escopo suportado e limites do v1

**Checklist de execucao**

- [ ] importacao nao duplica slug sem regra clara
- [ ] redirects sao gerados corretamente
- [ ] categorias e tags mapeiam direito
- [ ] erros de arquivo invalido retornam mensagem util
- [ ] migrar um site pequeno ou medio deixa de ser proibitivo

**Dependencias**

- launch controlado v1 operando
- clareza sobre ICP e principais origens de migracao
- capacidade minima de suporte para import assistido

**Gate de passagem**

- existe um caminho repetivel para trazer conteudo de plataformas comuns
- a migracao inicial deixa de depender de projeto manual excessivo

**Fora de escopo**

- temas complexos de WordPress
- plugins e layouts equivalentes automaticos
- comentarios com fidelidade perfeita

## Fase 8 - Retencao e expansao pos-launch

**Status:** `later`

**Objetivo**

Evoluir o produto com base em uso real, sinais de saude de conta e oportunidades de expansao.

**Por que isso importa**

Depois do launch e das primeiras migracoes, o produto precisa passar a evoluir por dados de uso e negocio, nao por intuicao isolada.

**Escopo da fase**

- health score de projeto
- sinais de risco de abandono
- recomendacoes de proximo passo no dashboard
- relatorios de uso e engajamento por projeto
- backlog guiado por feedback real

**Entregas obrigatorias**

- health score inicial ou equivalente
- sinais canonicos de risco e oportunidade
- recomendacoes de next best action
- backlog pos-launch guiado por dados e feedback

**Checklist de execucao**

- [ ] score responde a estados reais do projeto
- [ ] recomendacoes nao entram em conflito com setup ja concluido
- [ ] sinais de risco tem leitura minimamente acionavel
- [ ] backlog de produto passa a usar feedback e uso real como filtro principal

**Dependencias**

- base de instrumentacao confiavel
- volume minimo de contas reais para gerar sinal
- operacao pos-launch suficientemente organizada para fechar o loop de aprendizado

**Gate de passagem**

- o produto passa a priorizar retencao e expansao com base em dados reais
- o time identifica risco e oportunidade antes de depender apenas de feedback reativo

**Fora de escopo**

- score excessivamente sofisticado no primeiro corte
- automacoes profundas antes de validar sinais simples
- reabertura do launch v1 por backlog historico

## Blocos recomendados de execucao

### Bloco 1 - Fechar ativacao e primeira impressao

- Fase 1 completa
- nucleo essencial da Fase 2
- base de eventos da Fase 4

**Meta do bloco**

Reduzir atrito de entrada, dar cara de produto utilizavel ao projeto novo e garantir leitura minima do que acontece no fluxo inicial.

### Bloco 2 - Fechar narrativa comercial e medicao

- restante da Fase 2
- Fase 3
- consolidacao principal da Fase 4

**Meta do bloco**

Deixar o produto entendivel para o mercado e medivel para o time antes de ampliar beta e pressao comercial.

### Bloco 3 - Fechar readiness operacional do launch

- Fase 5
- correcoes puxadas por validacao real das Fases 1-4

**Meta do bloco**

Substituir improviso por processo minimo de launch, release, suporte inicial e consolidacao de aprendizados.

### Bloco 4 - Continuacao pos-launch

- Fase 6
- Fase 7
- preparacao da Fase 8

**Meta do bloco**

Melhorar conversao, destravar migracao e iniciar a camada de retencao orientada por uso real.

## KPIs oficiais do launch

### Ativacao

- tempo ate setup completo
- tempo ate primeiro post publicado
- percentual de projetos que concluem setup
- percentual de projetos que publicam na primeira semana

### Conversao

- taxa de subscribe de newsletter
- taxa de conversao visitor -> account
- taxa de conversao visitor -> paid
- CTR do CTA principal
- conversao da pricing page

### Operacao

- quantidade de contas beta onboarded com sucesso
- principais gargalos de onboarding
- tempo medio de resposta inicial
- quantidade de incidentes que exigem intervencao manual

### Receita e confianca comercial

- MRR inicial
- split mensal vs anual quando aplicavel
- taxa de cancelamento no primeiro ciclo
- taxa de past_due

## Riscos principais do ciclo

### Risco 1 - Voltar ao modo "mais feature"

**Sintoma**

Backlog volta a privilegiar fundacao e expansao sem melhorar setup, conversao, operacao ou capacidade de medir.

**Mitigacao**

Usar este roadmap como criterio oficial de prioridade e exigir que qualquer mudanca de escopo aponte qual KPI ou gate ela melhora.

### Risco 2 - O roadmap voltar a competir com docs auxiliares

**Sintoma**

O roadmap principal volta a ficar raso demais, enquanto outro documento paralelo volta a concentrar o detalhe operacional.

**Mitigacao**

Manter neste documento a combinacao de prioridade, gates, escopo minimo e checklist de execucao por fase. Docs auxiliares devem complementar, nao duplicar.

### Risco 3 - Lancamento sem governanca de dados

**Sintoma**

Muitos eventos, pouca leitura confiavel e decisao baseada em intuicao.

**Mitigacao**

Usar a taxonomia oficial como referencia unica e limitar novos eventos a perguntas concretas de produto ou operacao.

### Risco 4 - Pos-launch invadindo o launch

**Sintoma**

Migracao, health score, expansao e backlog de maturidade passam a ser tratados como bloqueadores do v1.

**Mitigacao**

Classificar explicitamente esses temas como `next` ou `later`, salvo se um aprendizado de beta provar impacto direto no gate atual.

## Relacao com documentos auxiliares

Este roadmap nao substitui os docs operacionais de detalhe especializado. Ele define prioridade, sequencia, gates, escopo minimo e checklists por fase.

Documentos auxiliares:

- [docs/release-checklist.md](C:/Users/Win/Documents/GitHub/lumina/docs/release-checklist.md): procedimento de pre-release, release e rollback
- [docs/analytics-taxonomy.md](C:/Users/Win/Documents/GitHub/lumina/docs/analytics-taxonomy.md): taxonomia oficial de eventos e propriedades
- [docs/operations-runbook.md](C:/Users/Win/Documents/GitHub/lumina/docs/operations-runbook.md): rotina operacional, suporte e procedimentos recorrentes
- [docs/roadmap.md](C:/Users/Win/Documents/GitHub/lumina/docs/roadmap.md): visao mais ampla de evolucao do produto alem deste ciclo de launch

## Regra de revisao deste roadmap

Este roadmap deve ser revisado:

- no inicio de cada bloco relevante de execucao
- quando um gate de fase fechar
- quando um aprendizado de beta invalidar uma prioridade `now`
- quando um risco operacional ou comercial se mostrar maior do que o previsto

Pode mover prioridade quando houver:

- evidencia de friccao forte em ativacao
- evidencia de queda relevante em conversao
- bloqueio recorrente na operacao de beta
- ausencia de medicao em um ponto critico do launch

Nao deve reabrir escopo por conta propria por:

- backlog historico de features
- desejo de ampliar ICP antes do aprendizado do beta
- melhorias que aumentam complexidade sem melhorar os KPIs oficiais do launch
- itens claramente classificados como `later` sem nova evidencia de impacto direto

## Regra final de uso

Se houver conflito entre uma ideia nova e este roadmap, a pergunta correta nao e "isso seria bom para o produto?".

A pergunta correta e:

"isso melhora de forma concreta o launch controlado v1 do Lumina agora, ou pertence ao `next` / `later`?"

Se a resposta nao for clara, o item nao entra em `now`.
