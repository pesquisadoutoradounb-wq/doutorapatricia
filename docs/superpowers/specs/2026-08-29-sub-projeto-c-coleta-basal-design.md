# Sub-projeto C — Coleta dos instrumentos basais · Design

**Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental (UnB)**
Data: 2026-08-29 · Status: aprovado para implementação

---

## Contexto

Sub-projetos A (fundação) e B (informações gerais + TCLE + consentimento +
editor de documentos) estão no ar. O fluxo do participante é
`informacoes → tcle → sociodemografico → ysq → panas → instrucoes → vinhetas →
encerramento → concluido`, com retomada por `participants.etapa_atual`. As
etapas `sociodemografico`, `ysq` e `panas` hoje caem em `EtapaPlaceholder`.

Este sub-projeto entrega **as três telas de coleta basal** e a costura de
sessão necessária. Não entrega pontuação, análise nem visualização no painel.

As dúvidas de conteúdo foram respondidas pela pesquisadora (pasta `Patricia/`,
2026-08-29) e consolidadas abaixo.

## Escopo

**Entra:**
- Tela do Sociodemográfico (18 questões, seções A/B/C) com campos condicionais,
  autosave, retomada e avaliação de elegibilidade no envio.
- Tela do YSQ-S3: 90 itens em 9 blocos de 10, escala 1–6, autosave por item,
  retomada por bloco.
- Tela do PANAS: 19 termos, escala 1–5, instrução reescrita, autosave por item.
- Modal de abandono (comportamento global das telas de instrumento) +
  hook de verificação de respostas em branco.
- Estados terminais novos `inelegivel` e `interrompido` + rotas e telas.
- Migration `0011_coleta_basal.sql` e seeds.

**Fica de fora (peças posteriores):**
- Auto-score do YSQ (soma/média por esquema e domínio).
- Classificação do PANAS (afeto positivo/negativo/quadrante) — depende do
  mapeamento item→subescala, ainda pendente da pesquisadora.
- Qualquer visualização de resultado de instrumento no painel.
- Editor de conteúdo do Sociodemográfico (texto fica no bundle).
- Sub-projeto D (instruções, vinhetas, avaliação pós-imaginação, encerramento).

## Decisões (respostas da pesquisadora)

| # | Tema | Decisão |
|---|---|---|
| 4 | Q8 UF | Corrigir "feração" → "federação". Campo = **lista suspensa das 27 UFs**. "Resido fora do Brasil" libera campo "País". |
| 5 | Q9 renda | Remover a meta-frase do autor. Valor do salário mínimo **exibido no texto**, como constante `SALARIO_MINIMO_REFERENCIA` (default `R$ 1.621,00`). |
| 6 | obrigatórios | Q1 (idade) e Q8 (UF) obrigatórias (sem "Prefiro não responder"). Q14: "Não sei informar" e "Prefiro não responder" são mutuamente exclusivas dos checkboxes de diagnóstico. |
| 7 | elegibilidade | Inelegível se `idade < 18` **ou** Q15 = "Não" **ou** Q17 = "Não" **ou** Q18 = "Não". Participante responde o questionário **inteiro** antes de saber; avaliação só no "Concluir". Inelegível → tela terminal com o texto de agradecimento fornecido; não avança para o YSQ; dados retidos. |
| 8 | condicionais | Campos "Outra"/"Qual(is)?"/tempo aparecem só quando a opção-gatilho é marcada. |
| 9,10 | YSQ | Escala 1–6 com os 6 rótulos confirmados. 90 itens, ordem 1→90. Enunciados já em `docs/fonte-metodologia/`. |
| 11 | PANAS instrução | Reescrever para referência **"neste momento"** (sem "terapeuta"). |
| 12 | PANAS itens | 19 termos na ordem da transcrição, escala 1–5 com 5 rótulos. |
| 19 | obrigatoriedade | **Não força resposta.** Mecanismo único = modal de abandono ao tentar avançar com ≥2 respostas em branco na tela/bloco. Vale para todas as telas de instrumento. |
| — | layout YSQ | 9 blocos de ~10 itens com barra de progresso. |
| — | texto sociodem. | Fica no código (schema tipado), não no banco. |

### Pendências que NÃO bloqueiam C (registro)

- Mapeamento item→subescala do PANAS e faixas de classificação.
- PERGUNTAR 20 — granularidade de captura de tempos (explicar à pesquisadora).
- Áudios das 10 vinhetas + spec de formato.
- Identidade visual (PERGUNTAR 25).
- Q17 "Não sei" conta como inelegível? **Default: não** (registra e segue).
- Conferência final da transcrição automática dos 90 itens do YSQ contra o
  instrumento oficial.

## Modelo de dados

Tabelas já existentes (migrations 0002/0008), reutilizadas sem alteração de
forma: `sociodemographic_responses` (linha única por participante),
`ysq_item_responses` + `ysq_completions`, `panas_item_responses` +
`panas_completions`, `instrument_scale_points`, views
`ysq_itens_participante` / `panas_itens_participante` /
`escalas_instrumento_participante`. RLS de participante (dono escreve, dono/admin
leem) já está em 0004.

### Migration `0011_coleta_basal.sql`

```sql
alter type public.participant_step add value 'inelegivel';
alter type public.participant_step add value 'interrompido';
alter type public.invite_status  add value 'inelegivel';
alter type public.invite_status  add value 'interrompido';

alter table public.sociodemographic_responses
  add column elegivel boolean,
  add column inelegibilidade_motivos text[];
```

Ajuste no trigger `validar_avanco_etapa` (0006): além da regra monotônica,
permitir explicitamente:
- `sociodemografico → inelegivel`
- qualquer etapa não-terminal → `interrompido`

Ambos são terminais: uma vez em `inelegivel`/`interrompido`, nenhuma transição
é aceita para não-admin. `ORDEM` do trigger permanece a sequência feliz; os dois
novos valores são tratados como destinos laterais permitidos a partir das
origens acima.

### Seeds

- `seed.example.sql` (versionado, placeholders) e `seed.local.sql` (real,
  gitignore) ganham:
  - `instrument_scale_points`: `ysq` 1–6, `panas` 1–5 (rótulos confirmados).
  - `study_documents`: `ysq-instrucoes`, `panas-instrucoes`, `inelegibilidade`
    (com o texto de agradecimento fornecido pela pesquisadora), todos `ativo`.

`documentos_estudo_publico` (view de 0005) já serve qualquer slug ativo — as
telas de C consomem por slug, sem mudança de infra.

## Arquitetura de frontend

```
src/lib/instrumentos/
  sociodemografico.ts   schema tipado: seções, questões, opções, condicionais, SALARIO_MINIMO_REFERENCIA
  elegibilidade.ts      elegibilidade(respostas) -> { elegivel, motivos[] }
  ufs.ts                as 27 UFs (sigla + nome)
  respostasBranco.ts    contarBranco(itensAplicaveis, respostas)

src/lib/participantSession.ts
  ETAPAS +2 estados · rotaDaEtapa · helper concluirComInelegibilidade / interromperParticipacao

src/components/participar/
  EscalaLikert.tsx      grupo de rádios 1–N com rótulos das pontas/todos os pontos
  BlocoProgresso.tsx    "Bloco X de N" + barra
  ModalAbandono.tsx     diálogo acessível com o texto da pesquisadora
  CampoCondicional.tsx  wrapper que monta/desmonta conforme gatilho

src/hooks/
  useAutosave.ts        debounce + upsert, estado "salvando/salvo/erro"
  useVerificacaoBranco.ts  conta em branco na tela; decide seguir / avisar / abrir modal

src/routes/participar/
  Sociodemografico.tsx
  Ysq.tsx               controla o bloco atual
  Panas.tsx
  Inelegivel.tsx
  Interrompido.tsx
```

Rotas adicionadas em `App.tsx` sob `/participar`: `sociodemografico`, `ysq`,
`panas` (substituem o placeholder para essas etapas), `inelegivel`,
`interrompido`. `rotaDaEtapa` mapeia os novos estados; `EntrarComToken`
trata `inelegivel`/`interrompido` como encerrados (não retoma — mensagem
"Participação encerrada").

## Fluxos

### Sociodemográfico

1. Ao montar: carrega linha de `sociodemographic_responses` (se houver) e
   reconstrói o formulário.
2. Tela única rolável, 18 questões agrupadas em A / B / C. Campos condicionais
   via `CampoCondicional`. Q14: selecionar "Não sei informar" ou "Prefiro não
   responder" limpa e desabilita os checkboxes de diagnóstico e `q14_diagnostico_outro`;
   marcar um diagnóstico limpa aquelas duas.
3. Autosave por campo (debounce ~500 ms) → upsert parcial. "Prefiro não
   responder" grava a string `'prefiro_nao_responder'`, nunca `NULL`.
4. "Concluir": `useVerificacaoBranco` sobre os campos **aplicáveis**
   (respeitando condicionais e que Q1/Q8 são obrigatórias):
   - Q1 ou Q8 em branco → sempre bloqueia com realce (são obrigatórias).
   - Fora isso: 0 branco → segue; 1 branco → aviso inline, permite seguir;
     ≥2 branco → `ModalAbandono`.
5. Ao seguir: `elegibilidade(respostas)`. Grava `elegivel` +
   `inelegibilidade_motivos` + `completado_em`.
   - Elegível → `avancarEtapa('ysq')` → `/participar/etapa/ysq`.
   - Inelegível → `etapa_atual = 'inelegivel'` → `/participar/inelegivel`
     (renderiza `study_documents` slug `inelegibilidade`).

### YSQ-S3

1. Ao montar: carrega itens de `ysq_itens_participante`, rótulos de escala,
   instrução (`ysq-instrucoes`), respostas existentes de `ysq_item_responses`.
2. Bloco inicial = primeiro bloco (de 9) com algum item sem resposta; se todos
   respondidos, último bloco.
3. Cada bloco: 10 `EscalaLikert` (1–6). Autosave por item (upsert `valor`).
4. "Continuar": `useVerificacaoBranco` sobre os 10 itens do bloco
   (0 / 1 / ≥2 → segue / avisa / modal). Avança de bloco (estado local, sem
   tocar `etapa_atual`).
5. Após o bloco 9: grava `ysq_completions`, `avancarEtapa('panas')`.

### PANAS

1. Ao montar: itens de `panas_itens_participante`, rótulos, instrução
   (`panas-instrucoes`), respostas existentes.
2. Tela única, 19 `EscalaLikert` (1–5).
3. Autosave por item. "Concluir": verificação de branco sobre os 19.
4. Grava `panas_completions`, `avancarEtapa('instrucoes')` →
   `/participar/etapa/instrucoes` (placeholder até D).

### Modal de abandono

- Texto: *"Verificamos que você não respondeu as questões anteriores. Deseja
  interromper sua participação na pesquisa?"*
- **[Cancelar]** → fecha, volta à tela, realça as questões em branco.
- **[Sim, cancelar minha participação]** → `etapa_atual = 'interrompido'` →
  `/participar/interrompido` (tela sóbria de despedida). Token não retoma mais.
- Diálogo acessível: `role="dialog"`, `aria-modal`, foco preso, Esc = Cancelar.

## Tratamento de erros

- Falha de autosave: estado "não salvo" visível, retry automático no próximo
  autosave e ao "Continuar"; "Continuar" só prossegue após um flush bem-sucedido
  (senão mostra "Não foi possível salvar; verifique sua conexão").
- Falha ao carregar itens/instrução: mensagem de reconexão, botão "Tentar de
  novo", nunca erro técnico.
- `avancarEtapa` rejeitado pelo trigger (corrida/duplo clique): re-consulta
  `etapa_atual` e navega para a rota correta.

## Testes (`tests/unit`, padrão existente)

- `elegibilidade`: cada gatilho isolado (idade 17, Q15/Q17/Q18 = "Não"),
  combinações, e caso elegível → `motivos` vazio. `idade 18` = elegível.
  Q17 "Não sei" = elegível (default).
- `contarBranco` / decisão do modal: 0 → seguir, 1 → avisar, ≥2 → modal;
  ignora campos escondidos por condicional.
- Sociodemográfico schema: exclusividade da Q14; "Outra" de Q3/Q5/Q7;
  "País" só com "fora do Brasil"; Q10 tempo só com "Sim".
- YSQ: cálculo do bloco inicial a partir de um conjunto parcial de respostas;
  fronteiras (bloco 1 vazio, bloco 9 incompleto, tudo completo).
- `rotaDaEtapa`: `inelegivel` e `interrompido`.
- `proximaEtapa` inalterado no caminho feliz.

## Fora de escopo explícito / YAGNI

- Sem tela de revisão/resumo antes de enviar cada instrumento.
- Sem exportação, sem CSV, sem dashboard de instrumento.
- Sem versionamento do schema do sociodemográfico (é código).
- Sem "voltar um item" no YSQ além de navegar entre blocos já visitados.
