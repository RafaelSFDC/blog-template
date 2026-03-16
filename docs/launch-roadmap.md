# Roadmap Canonico de Launch v1 do Lumina

## Objetivo

Este documento define a sequencia oficial, os gates de passagem e os criterios de pronto para o launch controlado v1 do Lumina.

Ele existe para uso interno do time e deve responder com clareza:

- o que e obrigatorio para o launch controlado v1
- em que ordem as frentes devem acontecer
- como saber se uma fase realmente terminou
- o que deve esperar para depois do launch

Este roadmap e a fonte canonica de prioridade e sequencia do ciclo de lancamento. Ele nao substitui os docs operacionais; ele aponta para eles.

## Publico-alvo

Este documento foi escrito para:

- fundadores e product owners definirem prioridade
- engenharia alinhar escopo e dependencias
- operacao e go-to-market saberem o que precisa existir antes de trazer beta users e primeiros clientes pagantes

## O que significa "launch controlado v1"

Para o Lumina, "launch controlado v1" significa:

- beta estruturado com onboarding repetivel
- capacidade de levar um admin novo a um site configurado sem ajuda de engenharia
- superfices comerciais claras o bastante para captar interesse e iniciar conversa comercial
- capacidade de medir ativacao, conversao e friccao principal
- readiness minima para operar os primeiros clientes pagantes com confianca razoavel

Nao significa concluir toda a visao do produto. Migracao ampla, health score sofisticado, expansao e backlog pos-launch continuam importantes, mas nao bloqueiam este ciclo.

## Status oficiais deste roadmap

Todo item, fase ou iniciativa referenciado a partir deste documento deve ser classificado com um destes status:

- `now`: obrigatorio para o launch controlado v1 e com prioridade ativa
- `next`: importante logo apos o launch ou assim que um gate atual fechar
- `later`: relevante para a visao do produto, mas fora da janela de decisao do launch v1

Regra pratica:

- `now` bloqueia launch se nao estiver pronto
- `next` nao bloqueia o launch, mas orienta a fila imediata seguinte
- `later` nao entra no escopo de decisao do ciclo atual

## O que e "launch-ready"

Consideramos o Lumina pronto para launch controlado v1 quando os pontos abaixo estiverem atendidos:

- um admin novo sai do zero para um site minimamente configurado sem ajuda manual
- um projeto novo deixa de parecer plataforma vazia logo apos o setup
- o valor do proprio Lumina esta claro nas superfices comerciais
- os principais pontos do funil visitante -> subscriber -> paid estao instrumentados
- existe processo minimo para onboarding, suporte inicial, triagem e feedback de beta users
- o time consegue executar release, smoke check e rollback com um procedimento definido

Os pontos abaixo sao importantes, mas nao entram como bloqueadores deste launch:

- importadores completos de migracao
- health score de projeto
- expansao orientada por sinais de conta
- backlog amplo de retencao pos-lancamento

## Principios de priorizacao

- priorizar ativacao, conversao e clareza comercial acima de novas frentes de fundacao
- reduzir tempo ate primeiro valor como KPI principal do ciclo
- instrumentar antes de escalar aquisicao
- evitar backlog "bonito no papel" que nao melhora setup, conversao, operacao ou capacidade de medir
- tratar implementado como insuficiente ate estar validado, medivel e compreensivel para o time
- manter o escopo do launch focado em beta estruturado e primeiros clientes pagantes

## Gate de passagem

"Gate de passagem" e o criterio oficial para encerrar uma fase e iniciar a proxima.

Uma fase so pode ser considerada concluida quando:

- as entregas minimas da fase existem
- o comportamento principal foi validado
- os eventos relevantes foram instrumentados quando aplicavel
- o time consegue explicar o que mudou, o que ficou de fora e o que ainda representa risco

Nao consideramos uma fase pronta apenas porque o codigo foi implementado.

## Fases do launch v1

### Fase 1 - Ativacao e first-run experience

**Status:** `now`

**Objetivo**

Levar um admin novo do primeiro login ate um projeto minimamente configurado com pouca duvida e pouca navegacao aleatoria.

**Por que isso importa para o launch**

Sem first-run forte, o produto parece mais complexo do que realmente e trava ativacao antes mesmo da avaliacao de valor.

**Entregas minimas que ja possuem base no produto**

- wizard inicial para admins no primeiro acesso
- progresso persistido do setup
- checklist de onboarding no dashboard
- score ou status de completude do setup
- recomendacao clara de proximo passo no dashboard
- atalhos fortes para identidade, pricing, newsletter e primeiro conteudo

**Fechamentos ainda obrigatorios nesta fase**

- checklist e wizard refletindo o mesmo estado sem ambiguidades
- regras de redirect e conclusao consistentes para `admin` e `superAdmin`
- proximo passo do dashboard batendo com o bloqueio real do setup
- fluxo principal validado de ponta a ponta sem intervencao manual

**Dependencias**

- helper central de completude
- permissao correta para `admin` e `superAdmin`
- base de settings e criacao de paginas ja existente no produto

**Gate de passagem**

- um admin novo entende o que fazer nos primeiros minutos
- o dashboard mostra o proximo passo de forma objetiva
- o setup refletido no produto bate com o checklist exibido
- o fluxo principal pode ser testado de ponta a ponta sem intervencao manual

**Fora de escopo nesta fase**

- health score sofisticado
- onboarding de equipe multiusuario avancado
- qualquer expansao que nao reduza diretamente o tempo ate primeiro valor

### Fase 2 - Time-to-beauty e proposta inicial de valor

**Status:** `now`

**Objetivo**

Fazer o projeto novo parecer um site real e publicavel logo apos o setup inicial.

**Por que isso importa para o launch**

Mesmo quando o setup funciona, um site vazio ou improvisado reduz percepcao de valor e enfraquece onboarding, demos e conversao.

**Entregas minimas que ja possuem base no produto**

- presets globais por tipo de projeto
- templates minimos para home, about, pricing, contact e welcome post
- starter content e copy baseados no preset escolhido
- menus, heroes e placeholders mais coerentes
- rotas publicas priorizando conteudo gerenciado quando disponivel

**Fechamentos ainda obrigatorios nesta fase**

- presets produzindo resultado publico coerente entre dashboard, paginas criadas e homepage fallback
- starter content seguro para reexecucao, sem duplicacao ou confusao
- paginas essenciais saindo do setup com expectativa clara de revisao
- projeto novo parecendo intencional mesmo antes de customizacao profunda

**Dependencias**

- conclusao funcional da Fase 1
- capacidade de gerar paginas base e drafts com seguranca
- biblioteca atual de blocos e CMS/Puck como base de template

**Gate de passagem**

- um projeto novo parece um site real sem customizacao extensa
- o admin nao precisa montar as paginas centrais do zero
- o preset escolhido produz uma direcao visual e editorial clara

**Fora de escopo nesta fase**

- sistema de theming profundo
- reconstrucao ampla de editor
- backlog de layout altamente customizavel

## Bloco atual de execucao - fechamento de Fases 1-2

O estado atual do produto mostra que a base principal das Fases 1 e 2 ja existe. O foco deste bloco nao e construir onboarding do zero, e sim fechar consistencia, clareza e validacao do que ja foi implementado.

Hoje o produto ja possui:

- wizard de setup
- progresso persistido
- checklist no dashboard
- presets e starter content
- templates base e fallback publico

**Objetivo do bloco atual**

Fechar os gaps restantes de ativacao e time-to-beauty para que o launch dependa de confiabilidade e clareza operacional, nao de expansao de escopo.

**Prioridade imediata deste bloco**

1. alinhamento entre wizard, checklist e estado real do projeto
2. idempotencia e previsibilidade de starter content e presets
3. clareza do proximo passo no dashboard e no first-run
4. qualidade do resultado visual e publicavel logo apos setup
5. validacao end-to-end sem intervencao manual

**Gate do bloco atual**

- um admin novo conclui setup sem ajuda manual
- dashboard e wizard apontam para o mesmo estado e a mesma proxima acao
- o preset escolhido resulta em home, paginas essenciais e primeiro conteudo coerentes
- reabrir setup nao gera estado quebrado nem duplicacao indevida
- a experiencia inicial pode ser validada em fluxo real de ponta a ponta

**Regra de prioridade imediata**

Qualquer item novo em `now` dentro das Fases 1 e 2 precisa melhorar de forma concreta ativacao, clareza do setup ou qualidade do site inicial. Se nao melhorar um desses pontos de forma direta, o item vai para `next`.

### Fase 3 - Superficies comerciais e conversao inicial

**Status:** `now`

**Objetivo**

Fazer o Lumina se explicar melhor e reduzir friccao nas superfices que transformam interesse em beta request, subscriber ou paid.

**Por que isso importa para o launch**

O produto pode estar forte tecnicamente e ainda assim falhar comercialmente se narrativa, CTA e pricing nao forem claros.

**Entregas minimas**

- namespace comercial `/lumina` com shell proprio
- landing principal do produto
- pagina de pricing do proprio Lumina
- pagina how it works e FAQ comercial
- paginas por ICP principal ou equivalentes
- fluxo de beta request reaproveitando pipeline existente
- melhoria da pricing publica, paywall e CTAs mais relevantes para o funil inicial

**Dependencias**

- clareza de ICP e proposta de valor do launch
- base publica estavel para rotas institucionais
- eventos canonicamente definidos para CTA e beta request

**Gate de passagem**

- um visitante entende em poucos segundos para quem o Lumina serve e qual problema resolve
- os CTAs principais estao consistentes e navegaveis
- pricing e paywall deixam claro o proximo passo comercial

**Fora de escopo nesta fase**

- reabertura da arquitetura completa de memberships
- experimentacao comercial extensa sem baseline clara
- expansao para multiplos segmentos fora do ICP principal

### Fase 4 - Instrumentacao e governanca de decisao

**Status:** `now`

**Objetivo**

Dar ao time uma camada confiavel para medir ativacao, conversao, newsletter e receita durante o launch.

**Por que isso importa para o launch**

Sem taxonomia e leituras consistentes, o time nao consegue diferenciar friccao real de impressao subjetiva.

**Entregas minimas**

- catalogo oficial de eventos adotado como referencia
- helpers centralizados de captura client e server
- eventos canonicos cobrindo onboarding, marketing, newsletter e revenue
- dual-write temporario apenas onde necessario
- dashboard interno organizado por perguntas de produto
- filtros e leituras minimas de 7d, 30d e 90d

**Dependencias**

- principais fluxos das Fases 1 e 3 definidos
- PostHog e pipeline atual em estado utilizavel
- alinhamento entre eventos novos e consultas do dashboard

**Gate de passagem**

- o time consegue identificar onde o setup trava
- o time consegue ver onde o checkout cai
- as superficies comerciais e de newsletter possuem leitura minima confiavel
- eventos principais disparam com consistencia nas rotas criticas

**Fora de escopo nesta fase**

- analytics perfeito ou exaustivo
- dashboards altamente customizados por area
- taxonomia aberta a proliferacao sem governanca

### Fase 5 - Operacao minima de launch

**Status:** `now`

**Objetivo**

Trocar improviso por um processo minimo de beta, release e suporte inicial para os primeiros usuarios reais.

**Por que isso importa para o launch**

Sem operacao minima, qualquer problema de onboarding, billing ou release vira gargalo manual e reduz confianca para abrir o produto.

**Entregas minimas**

- playbook de onboarding de beta users
- base de conhecimento inicial para tarefas recorrentes
- templates de resposta e triagem inicial
- classificacao minima de contas ou casos operacionais
- checklist de release e smoke checks usados como procedimento real
- rotina basica de feedback e consolidacao de aprendizados

**Dependencias**

- superfices principais do produto ja utilizaveis
- runbooks e checklist de release existentes como ponto de partida
- capacidade minima de observacao de incidentes e falhas criticas

**Gate de passagem**

- o time consegue onboardar beta users com repetibilidade
- o time sabe como validar uma release antes e depois do deploy
- feedback chega em formato classificavel e acionavel
- problemas mais comuns de onboarding, billing ou publish tem procedimento minimo de resposta

**Fora de escopo nesta fase**

- customer success altamente automatizado
- painel sofisticado de health score
- operacao enterprise ou suporte multi-tier

## O que fica para depois do launch

Os itens abaixo sao importantes, mas ficam classificados como `next` ou `later` e nao bloqueiam o launch controlado v1:

- importacao e migracao assistida mais ampla
- health score e sinais automatizados de risco
- expansao guiada por retencao pos-lancamento
- backlog profundo de automacoes, personalizacao e crescimento de plataforma

Regra de classificacao:

- `next`: itens que ajudam a reduzir friccao comercial ou operacional logo apos o launch
- `later`: itens que pertencem a maturidade mais ampla do produto e nao devem reabrir o escopo atual

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

Usar este roadmap como criterio oficial de prioridade e exigir que qualquer mudanca de escopo aponte qual KPI ou gate de launch ela melhora.

### Risco 2 - Roadmap canonico competir com docs auxiliares

**Sintoma**

O roadmap principal volta a acumular checklist operacional e passa a duplicar stages, taxonomia ou release process.

**Mitigacao**

Manter neste documento apenas prioridade, gates, escopo minimo e fronteira `now` / `next` / `later`.

### Risco 3 - Lançamento sem governanca de dados

**Sintoma**

Muitos eventos, pouca leitura confiavel e decisao baseada em intuicao.

**Mitigacao**

Usar a taxonomia oficial como referencia unica e limitar novos eventos a perguntas concretas de produto ou operacao.

### Risco 4 - Pos-launch invadindo o launch

**Sintoma**

Migracao, health score, expansao e backlog de maturidade passam a ser tratados como bloqueadores do v1.

**Mitigacao**

Classificar explicitamente esses temas como `next` ou `later`, salvo se um aprendizado de beta provar impacto direto no gate atual.

## Mapa dos documentos auxiliares

- [docs/launch-roadmap.md](C:/Users/Win/Documents/GitHub/lumina/docs/launch-roadmap.md): fonte canonica de prioridade, sequencia, gates e definicao de pronto do launch v1
- [docs/launch-roadmap-stages.md](C:/Users/Win/Documents/GitHub/lumina/docs/launch-roadmap-stages.md): detalhamento operacional por estagio, com mais granularidade de implementacao
- [docs/release-checklist.md](C:/Users/Win/Documents/GitHub/lumina/docs/release-checklist.md): procedimento de pre-release, release e rollback
- [docs/analytics-taxonomy.md](C:/Users/Win/Documents/GitHub/lumina/docs/analytics-taxonomy.md): taxonomia oficial de eventos e propriedades
- [docs/roadmap.md](C:/Users/Win/Documents/GitHub/lumina/docs/roadmap.md): visao mais ampla de evolucao do produto alem do launch v1

## Regra de revisao deste roadmap

Este roadmap deve ser revisado:

- no inicio de cada bloco relevante de execucao
- quando um gate de fase fechar
- quando um aprendizado de beta invalidar uma prioridade `now`
- quando um risco operacional ou comercial se mostrar maior do que o previsto

Pode mover prioridade:

- evidencia de friccao forte em ativacao
- evidencia de queda relevante em conversao
- bloqueio recorrente na operacao de beta
- ausencia de medicao em um ponto critico do launch

Nao deve reabrir escopo por conta propria:

- backlog historico de features
- desejo de ampliar ICP antes do aprendizado do beta
- melhorias que aumentam complexidade sem melhorar os KPIs oficiais do launch
- itens claramente classificados como `later` sem nova evidencia de impacto direto

## Regra final de uso

Se houver conflito entre uma ideia nova e este roadmap, a pergunta correta nao e "isso seria bom para o produto?".

A pergunta correta e:

"isso melhora de forma concreta o launch controlado v1 do Lumina agora, ou pertence ao `next` / `later`?"

Se a resposta nao for clara, o item nao entra em `now`.
