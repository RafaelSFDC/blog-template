# Lumina Roadmap

## Objetivo

Levar o Lumina do estado atual de CMS editorial promissor para um **CMS open source single-site maduro**, capaz de substituir o WordPress em muitos cenários de blog, revista, publicação premium e site de conteúdo.

## Princípios do roadmap

- priorizar comportamento entregue ao usuário
- consolidar o core antes de expandir o ecossistema
- equilibrar experiência para não programadores e flexibilidade para programadores
- tratar operação, testes e segurança como parte do produto

## Fase 1: Consolidar o CMS core

### Conteúdo e fluxo editorial

- [ ] Fechar o fluxo de post e página com estados consistentes de rascunho, agendado, publicado e arquivado.
- [ ] Implementar preview editorial confiável para posts e páginas.
- [ ] Adicionar autosave no editor.
- [ ] Implementar histórico de versões e restauração de conteúdo.
- [ ] Melhorar o fluxo de revisão editorial entre autor, editor e publicação.
- [ ] Garantir validações claras para slug, SEO, publicação e conteúdo premium.

### Editor e mídia

- [ ] Consolidar um editor rico oficial do produto e remover ambiguidade entre demos e componentes experimentais.
- [ ] Melhorar upload de mídia com feedback de progresso, validação e mensagens de erro.
- [ ] Adicionar biblioteca de mídia com busca, filtro e edição de metadados.
- [ ] Garantir uso consistente de imagem destacada, capa, alt text e embeds.

### Estrutura pública e navegação

- [ ] Consolidar páginas públicas dinâmicas como recurso oficial do CMS.
- [ ] Fechar gestão de homepage pelo painel com regras claras.
- [ ] Finalizar gestão de menus como funcionalidade utilizável em produção.
- [ ] Finalizar gestão de redirects com interface, validação e efeito real no roteamento.

### Core técnico

- [ ] Revisar consistência entre schema, rotas, server actions e interface administrativa.
- [ ] Remover lacunas entre rotas presentes e funcionalidades realmente entregues.
- [ ] Atualizar `README.md` para refletir que o projeto é um CMS em evolução, não apenas um blog template.

## Fase 2: Melhorar a experiência não técnica

### Painel e configuração

- [ ] Evoluir `settings` para um centro de configuração claro para marca, SEO global, links sociais e identidade visual.
- [ ] Permitir personalização visual suficiente sem código para logo, cores, tipografia e variantes de layout.
- [ ] Melhorar textos, estados vazios, onboarding e feedbacks do painel para usuários não técnicos.
- [ ] Padronizar tabelas, formulários, filtros e ações administrativas no dashboard.

### Aparência e site building leve

- [ ] Criar blocos e padrões reutilizáveis para páginas institucionais e landing pages.
- [ ] Permitir composições simples de seções sem exigir edição manual de código.
- [ ] Definir uma camada inicial de temas do produto, mesmo que ainda sem sistema completo de temas intercambiáveis.
- [ ] Garantir experiência excelente em mobile no painel e no site público.

### Usuários e permissões

- [ ] Consolidar gestão de papéis e permissões com regras claras por área do CMS.
- [ ] Melhorar administração de equipe editorial.
- [ ] Adicionar proteção e UX melhor para ações críticas como exclusão, banimento e mudanças de acesso.

## Fase 3: Audiência, monetização e automações

### Comentários e comunidade

- [ ] Melhorar moderação de comentários com filas, filtros e ações em lote.
- [ ] Adicionar proteção anti-spam e limites básicos contra abuso.
- [ ] Melhorar a experiência pública de comentários para aumentar participação com segurança.

### Newsletter e audiência

- [ ] Fechar o fluxo de newsletter do produto: criação, envio, histórico e gestão de campanhas.
- [ ] Melhorar captação de inscritos em home, posts, páginas e áreas premium.
- [ ] Adicionar segmentação inicial de audiência e métricas básicas por campanha.
- [ ] Consolidar mensagens de contato e inbox editorial como área operacional do painel.

### Monetização

- [ ] Fechar o fluxo de assinatura e acesso premium de ponta a ponta.
- [ ] Definir regras claras para conteúdo pago, acesso do assinante e estados de cobrança.
- [ ] Melhorar área de conta do leitor para assinatura, cobrança e acesso.
- [ ] Ampliar a base de monetização para planos, paywall e experiência premium consistente.

### Analytics e automações

- [ ] Evoluir analytics para visão de posts mais lidos, conversão, retenção, origem de tráfego e performance editorial.
- [ ] Conectar melhor métricas do painel com eventos capturados no produto.
- [ ] Consolidar publicação agendada como automação confiável.
- [ ] Criar automações úteis como notificações editoriais, envios e webhooks por eventos importantes.

## Fase 4: Operação, segurança e ecossistema

### Operação e confiabilidade

- [ ] Implementar estratégia clara de backup e restauração.
- [ ] Adicionar observabilidade com logs úteis, erros rastreáveis e alertas.
- [ ] Documentar deploy, ambiente local, produção e recuperação operacional.
- [ ] Garantir migrações seguras e previsíveis.

### Segurança e governança

- [ ] Reforçar segurança de autenticação, sessões e ações administrativas.
- [ ] Adicionar trilha de auditoria para mudanças sensíveis.
- [ ] Revisar políticas de permissão e exposição de endpoints.
- [ ] Endurecer fluxos de upload, webhooks e integrações externas.

### DX, documentação e qualidade

- [ ] Expandir testes unitários para áreas administrativas ainda sem cobertura.
- [ ] Adicionar testes de integração para fluxos editoriais principais.
- [ ] Adicionar testes end-to-end para publicação, autenticação, comentário, newsletter e assinatura.
- [ ] Documentar arquitetura, convenções e fluxos principais para contribuidores.
- [ ] Definir critérios mínimos de qualidade para aceitar novas features.

### Evolução futura opcional

- [ ] Planejar uma camada de extensibilidade oficial para integrações e customizações.
- [ ] Avaliar sistema inicial de temas mais desacoplado.
- [ ] Estudar importadores de conteúdo e migração de outras plataformas.
- [ ] Tratar plugin system e multisite apenas como possibilidades futuras, não como prioridade atual.

## Checklist transversal

- [ ] Toda feature importante precisa ter UX no painel e comportamento real no site público.
- [ ] Toda área crítica precisa ter critérios mínimos de teste.
- [ ] Toda integração externa precisa ter tratamento de erro e observabilidade.
- [ ] Toda funcionalidade voltada a não programadores precisa evitar depender de edição manual de código.
- [ ] Toda documentação principal precisa acompanhar a evolução real do produto.

## Definição de chegada

O Lumina poderá ser considerado próximo do objetivo quando entregar, de forma coesa:

- publicação editorial confiável
- painel administrativo maduro
- páginas e navegação administráveis
- mídia e SEO bem resolvidos
- comentários, newsletter e audiência operáveis
- monetização funcional
- analytics úteis
- personalização visual suficiente
- deploy e operação confiáveis
- documentação e testes compatíveis com uso real
