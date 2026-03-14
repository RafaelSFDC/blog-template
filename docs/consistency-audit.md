# Auditoria De Consistencia Tecnica

## Como Ler

Este documento registra achados concretos observados no codigo atual. Cada finding inclui:

- sintoma
- impacto
- recomendacao

As categorias abaixo refletem as areas mais importantes para consistencia do projeto.

## Findings Mais Criticos

### Qualidade E Testes

#### 1. A suite de testes exigia setup global de APIs de browser para ficar utilizavel

Sintoma:

- `pnpm test` falhava em `src/components/dashboard/editorial-preview.test.tsx`
- erro observado anteriormente: `ResizeObserver is not defined`

Impacto:

- sem setup adequado, o pipeline de qualidade ficava fragil para componentes editoriais
- componentes dependentes de Puck ou `@dnd-kit` exigem infraestrutura minima de ambiente para serem testaveis

Recomendacao:

- manter setup de teste para APIs de browser faltantes
- isolar ou mockar dependencias pesadas de editor/drag-and-drop
- registrar esse requisito em `docs/testing-quality.md`

#### 2. O lint tinha erros basicos de hygiene que quebravam a baseline

Sintoma:

- `pnpm lint` falhava por import morto em `src/components/cms/puck.config.tsx`
- `pnpm lint` falhava por import morto em `vite.config.ts`

Impacto:

- erros basicos de hygiene reduzem a confianca na baseline
- dificultam diferenciar regressao real de problema preexistente

Recomendacao:

- manter `lint` como baseline obrigatoria antes de novos refactors maiores
- evitar acumular erros simples de imports mortos

## Duplicacao De Codigo

### 3. As telas de criar e editar pagina possuiam duplicacao forte

Sintoma:

- `src/routes/dashboard/pages/new.tsx` e `src/routes/dashboard/pages/$pageId.edit.tsx` compartilhavam estrutura, campos, alternancia entre Tiptap/Puck, preview, SEO e submit com poucas variacoes

Impacto:

- qualquer ajuste de UX, validacao ou editor precisa ser replicado
- aumenta risco de divergencia funcional entre create e edit

Recomendacao:

- item corrigido com um screen compartilhado para paginas
- manter o mesmo padrao para futuras entidades administrativas

### 4. Havia indicios de duplicacao equivalente no fluxo de posts

Sintoma:

- o padrao de create/edit de posts seguia uma composicao similar a paginas, com grande chance de repeticao estrutural

Impacto:

- manutencao futura mais cara
- risco de inconsistencias entre modos de edicao

Recomendacao:

- item corrigido com um screen compartilhado para posts
- manter helpers puros como fonte de verdade para slug, preview e submit

## Inconsistencias Arquiteturais

### 5. A documentacao arquitetural do modulo editorial ainda precisava explicitar melhor a divisao entre ferramentas

Sintoma:

- coexistem `LazyTiptapEditor`, `tiptap-editor`, `cms/Editor`, `PageContent` e helpers de `puck`
- sem contexto adicional, isso podia parecer sobreposicao de estrategia

Impacto:

- aumenta o custo cognitivo para evoluir a camada editorial
- dificulta perceber que as ferramentas atendem entidades diferentes

Recomendacao:

- documentar explicitamente que `Tiptap` e a ferramenta de posts
- documentar explicitamente que `Puck` e a ferramenta de paginas
- tratar formatos legados ou compatibilidades como detalhe tecnico, nao como disputa de produto

### 6. A fronteira entre `src/server` e `src/lib` ainda nao esta totalmente cristalina

Sintoma:

- ha dominio em `src/server`, mas tambem varios helpers relevantes de fluxo em `src/lib`

Impacto:

- novos colaboradores podem espalhar comportamento em camadas diferentes
- reduz previsibilidade da arquitetura

Recomendacao:

- formalizar a fronteira de responsabilidade na documentacao
- revisar gradualmente funcoes ambivalentes quando houver manutencao nelas

## Problemas De Organizacao

### 7. Codigo experimental misturado ao core era um sinal de desorganizacao

Sintoma:

- existiam `src/components/demo.*` e `src/hooks/demo.*`

Impacto:

- misturava sinais de produto e experimento no mesmo namespace
- dificultava leitura do que fazia parte do CMS oficial

Recomendacao:

- manter o core livre de artefatos experimentais isolados e sem uso
- nao adicionar novos artefatos experimentais no mesmo padrao sem isolamento

### 8. A documentacao de engenharia era parcial antes deste pacote

Sintoma:

- existiam docs de visao e roadmap, mas faltavam docs centrais de arquitetura, convencoes, fluxos e operacao

Impacto:

- onboarding mais lento
- decisoes recorrentes sendo refeitas por contexto oral ou inferencia do codigo

Recomendacao:

- manter `docs/` como fonte de verdade de engenharia
- exigir atualizacao documental em mudancas estruturais

## Naming E Padronizacao

### 9. O naming de arquivos e inconsistente

Sintoma:

- mistura de `PascalCase`, `kebab-case`, nomes simples e prefixos `demo.`

Impacto:

- reduz previsibilidade
- dificulta busca, code review e onboarding

Recomendacao:

- definir e aplicar um padrao unico para novos arquivos
- padronizar gradualmente arquivos legacy quando forem tocados

### 10. A UX e a documentacao misturavam portugues e ingles

Sintoma:

- labels, mensagens e descricoes apareciam em ambos os idiomas

Impacto:

- experiencia inconsistente
- mais ruido para futuros esforcos de localizacao

Recomendacao:

- item praticamente corrigido ao consolidar docs em portugues e UI em ingles
- manter a mesma regra em qualquer tela legacy que voltar a ser tocada

### 10.1. O dashboard ainda tinha listagens fora do padrao visual e comportamental consolidado

Sintoma:

- algumas telas administrativas usavam headers ad hoc, confirmacoes nativas com `confirm`, `alert` ou refresh por navegacao
- `subscribers`, `webhooks`, `newsletters`, `messages` e `comments` eram os sinais mais claros

Impacto:

- experiencia administrativa irregular
- menor previsibilidade de manutencao
- acoes destrutivas e estados vazios variavam entre rotas

Recomendacao:

- item parcialmente corrigido ao padronizar container, header, estados vazios, delete dialog e atualizacao local em listagens prioritarias
- continuar o mesmo criterio nas telas legacy restantes

### 10.2. Algumas acoes expostas no admin ainda sugeriam capacidades nao implementadas

Sintoma:

- a listagem de usuarios expunha acoes como banimento e exclusao de conta sem backend real associado
- a listagem de newsletters mostrava CTA de resultados sem tela ou fluxo consolidado

Impacto:

- a UX prometia operacoes que o produto ainda nao concluia
- aumentava a chance de suporte, confusao operacional e regressao ao tocar nessas telas

Recomendacao:

- item corrigido ao remover affordances sem implementacao real
- manter a regra de so expor CTA quando houver fluxo funcional de ponta a ponta

## Riscos Operacionais

### 11. Observabilidade, backup e recuperacao ainda nao estao maduros

Sintoma:

- ha logs e deploy funcional, mas nao ha playbook claro de backup/restauracao e auditoria de mudancas

Impacto:

- risco maior em incidentes
- operacao depende de conhecimento implicito

Recomendacao:

- documentar lacunas explicitamente
- priorizar estrategia minima de backup, restauracao e logs acionaveis

## Oportunidades De Performance E Simplificacao

### 12. O custo cognitivo do modulo editorial esta acima do ideal

Sintoma:

- coexistencia de builder visual, rich text editor, preview e serializacao em camadas diferentes

Impacto:

- aumenta tempo de manutencao
- eleva risco de bugs sutis entre modos de edicao e renderizacao

Recomendacao:

- reduzir caminhos alternativos
- definir contratos claros entre edicao, persistencia e renderizacao

### 13. A cobertura de testes ainda precisava proteger melhor normalizadores e regras criticas de submit

Sintoma:

- helpers de formulario e regras de comentario dependiam mais de leitura manual do que de testes automatizados

Impacto:

- refactors pequenos em submit, slug ou compatibilidade de settings podiam gerar regressao silenciosa

Recomendacao:

- item parcialmente corrigido com testes para `comment-actions`, `settings-form` e `editorial-form-utils`
- continuar expandindo para fluxos de auth e formularios administrativos em nivel de componente

### 14. Ha espaco para consolidacao de componentes e formularios administrativos

Sintoma:

- formularios e telas administrativas repetem muito layout, SEO panel, submit pattern e blocos de controle

Impacto:

- mais retrabalho
- UX administrativa pode divergir com facilidade

Recomendacao:

- extrair building blocks de editor administrativo compartilhados
- padronizar estrutura de create/edit por entidade

## Resumo Executivo

O projeto ja tem base forte de produto e arquitetura, mas os principais riscos de consistencia hoje estao em:

- necessidade de documentar com mais clareza a divisao editorial por entidade
- naming e organizacao pouco uniformes
- consolidacao arquitetural ainda incompleta
- padrao de idioma ainda precisa ser aplicado de forma mais sistematica
- algumas telas administrativas legacy ainda podem ser refinadas visualmente quando voltarem a ser tocadas

O backlog derivado desta auditoria esta em [`consistency-backlog.md`](./consistency-backlog.md).
