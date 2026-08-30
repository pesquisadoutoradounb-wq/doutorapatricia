# Sub-projeto D — Tarefa experimental de imaginação · Design

**Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental (UnB)**
Data: 2026-08-29 · Status: aprovado para implementação

---

## Contexto

Sub-projetos A, A.2, B e C estão no ar. Após o PANAS o participante entra em
`instrucoes` → `vinhetas` → `encerramento` → `concluido` — hoje as três primeiras
caem no `EtapaPlaceholder`. Este sub-projeto entrega a tarefa experimental
completa e fecha o fluxo do participante.

Fontes: `docs/fonte-metodologia/Instruções gerais ao participante.docx`,
`Patricia/vinhetas para plataforma.docx` (10 situações limpas),
`Patricia/avaliação pós imaginaçaõ plataforma.docx` (avaliação com a lógica de
desvio nova), `docs/fonte-metodologia/encerramento do procedimento
experimental.docx`. Respostas da pesquisadora: PERGUNTAR 13–20.

## Escopo

**Entra:**
- Tela de instruções gerais + geração da ordem randomizada das 10 vinhetas.
- Bloco de vinhetas: para cada uma (na ordem sorteada) — estímulo textual →
  áudio de imaginação guiada → avaliação pós-imaginação condicional.
- Captura de tempos (leitura, áudio ouvido, resposta).
- Encerramento: marca a participação como concluída; o link não retoma mais.
- Painel: tela mínima de upload de 1 áudio por vinheta (Storage + `audio_assets`).
- Migration `0013` + RPCs `gerar_ordem_vinhetas` e `concluir_participacao`.

**Fica de fora:**
- Pontuação/análise de qualquer instrumento (peça posterior).
- Gestão de convites, CSV, Brevo, exportações, dashboards adicionais (E).
- Edição do texto das vinhetas no painel (entra em E; hoje via `seed.local`).

## Decisões (PERGUNTAR + brainstorming 2026-08-29)

| Tema | Decisão |
|---|---|
| 13 | 10 áudios distintos (um por vinheta). **Painel ganha upload mínimo**; o fluxo tolera áudio ausente ("áudio ainda não disponível — continuar") para o piloto. Formato sugerido à pesquisadora: MP3 mono, ~128 kbps, < ~3 min / < 5 MB. |
| 14 | Tela do estímulo = "Situação N" + parágrafo + introdução "Leia atentamente a situação a seguir. Quando terminar, clique em 'Continuar'." → "Continuar" revela e toca o áudio. |
| 15 | IDs 1–5 = Domínio 1, 6–10 = Domínio 2 (só análise). **Ordem das 10 randomizada** por participante, gerada uma vez. |
| Áudio → avaliação | "Continuar" aparece **quando o áudio termina**; link discreto "já ouvi, continuar" ~10 s após o play (escape de piloto). Registra duração ouvida e se completou. |
| 16 | Q7 = "Não" **ou** "Não tenho certeza" → pula para Q12. Q8–11 só se "Sim". |
| 17 | Matriz secundária de 8 emoções (0–10) **entra** (`q3_matriz`). "Não percebi uma emoção específica" **fora** da Q2. Q3 = 0 ("nenhuma intensidade") → pula para Q4. |
| 17b (novo) | Q1 = 0 ("Não consegui me imaginar na situação") → pula direto para Q7. |
| 18 | Q2 = duas partes (aberta 2a + categórica 2b: 8 opções + "Outra"). |
| Q12 | Texto livre 12a + **matriz de 7 tendências + "Outra" (rótulo + 0–10)**. Sem nota geral à parte (`q12_forca_vontade` fica sem uso). |
| 19 | Não força resposta: 2+ em branco nas questões visíveis → modal de abandono (reaproveitado de C) → estado `interrompido`; 1 em branco = aviso inline. |
| 20 | Captura de tempos: timestamps de entrada/saída de cada sub-tela + início/fim do áudio + duração ouvida + `audio_completou` + início/envio da avaliação. **Explicar em linguagem simples à pesquisadora** (nota abaixo); não bloqueia. |

### Nota para a pesquisadora (PERGUNTAR 20, em linguagem simples)

> A plataforma anota automaticamente só *horários* (nunca conteúdo): quando a
> vinheta apareceu e quando você clicou em "Continuar" (→ tempo de leitura);
> quando o áudio começou e terminou, e quanto dele foi ouvido (→ ouviu inteiro?
> parou antes?); quando a avaliação abriu e quando foi enviada (→ tempo de
> resposta). Nada além de marcas de tempo é registrado.

### Pendências que NÃO bloqueiam D

- Gravação dos 10 áudios (pesquisadora).
- Texto exato de `instrucoes_gerais` e `encerramento`: hoje via `seed.local`
  (rascunho-fonte); editável no painel (B).
- Identidade visual (PERGUNTAR 25).

## Modelo de dados

Reutiliza `vignettes`, `audio_assets`, `vignette_order`, `vignette_responses`
(migrations 0002/0007/0009) e as views `vinhetas_participante` /
`audios_participante` (0005).

### Migration `0013_tarefa_experimental.sql`

```sql
-- Q12 vira matriz (PERGUNTAR: matriz de 7 tendências + "Outra")
alter table public.vignette_responses
  add column if not exists q12_matriz jsonb;
-- q12_matriz: { atender, expressar, evitar, silencio, explicar, afastar,
--               criticar_se: 0..10, outra: { rotulo: text, valor: 0..10 } }
-- q12_tendencia_aberta (já existe) = texto livre 12a.
-- q12_forca_vontade (já existe) = sem uso nesta versão; mantida por compat.
```

**RPC `gerar_ordem_vinhetas()`** — `security definer`, `set search_path = public`.
Para `current_participant_id()`: se já há linhas em `vignette_order`, retorna-as;
senão, insere uma permutação aleatória de 1..10 (uma linha por vinheta do estudo
do participante, `posicao` 1..10) e retorna. Idempotente. `grant execute to
authenticated`. Uso: chamada ao sair das instruções.

**RPC `concluir_participacao()`** — `security definer`. Para o participante
atual, só se `etapa_atual = 'encerramento'`: `participants.concluido_em = now()`,
`etapa_atual = 'concluido'`, e `invites.status = 'concluido'` (via `invite_id`).
Idempotente (se já `concluido`, no-op). `grant execute to authenticated`.
Racional: o participante não tem `update` em `participants.concluido_em` nem em
`invites`; a RPC encapsula a transição final e faz o link parar de retomar
(`validarConvite` já rejeita `status = 'concluido'` com 409).

### `audio_assets` / Storage

Políticas de escrita de admin já existem (0004 `audio_write`, 0007 bucket
`audios`). Convenção de caminho: `estudo-1/vinheta-<id>.<ext>`. O painel faz
`storage.from('audios').upload(path, file, { upsert: true })` e
`upsert` em `audio_assets (vignette_id, storage_path, duracao_segundos)`.
`duracao_segundos` extraída no cliente via `HTMLAudioElement.duration` antes do
upload (best-effort; nullable).

## Arquitetura de frontend

```
src/lib/vinhetas/
  avaliacaoPosImaginacao.ts   schema das ~12 questões + lógica de desvio (puro)
  vinhetasFluxo.ts            carga (RPC ordem, textos, áudios, respostas) + posição atual
  escalas.ts                  definição das escalas 0–10 e −5..+5

src/components/participar/
  EscalaNumerica.tsx          régua de botões 0–10 ou −5..+5 (rótulos nas pontas)
  MatrizEmocoes.tsx           n linhas rotuladas, cada uma uma EscalaNumerica 0–10
  TocadorAudio.tsx            <audio> + gating "continuar ao terminar" / escape 10 s + telemetria

src/routes/participar/
  Instrucoes.tsx              doc `instrucoes_gerais` + "Iniciar" → RPC ordem → etapa 'vinhetas'
  Vinhetas.tsx                controlador: posição + sub-etapa (estimulo|audio|avaliacao)
  (Encerramento.tsx)          + chama RPC concluir_participacao ao montar

src/routes/painel/
  Audios.tsx                  lista as 10 vinhetas + upload de 1 áudio cada
```

`EtapaInstrumento` (de C) passa a despachar `instrucoes` → `Instrucoes` e
`vinhetas` → `Vinhetas` (hoje caem no placeholder).

## Fluxos

### Instruções (`etapa = instrucoes`)

`DocumentoRenderizado slug="instrucoes_gerais"` + botão "Iniciar". Ao clicar:
`supabase.rpc('gerar_ordem_vinhetas')` → `avancarEtapa('vinhetas')` →
`/participar/etapa/vinhetas`.

### Bloco de vinhetas (`etapa = vinhetas`)

`Vinhetas.tsx` ao montar carrega: ordem (RPC, idempotente), textos
(`vinhetas_participante`), áudios (`audios_participante`), respostas existentes
(`vignette_responses`). **Posição atual** = primeira vinheta da ordem sem
`vignette_responses.completado_em`; se todas concluídas → avança para
`encerramento`.

Para a vinheta na posição `k` (mostrada como "Situação k de 10"), três
sub-etapas em estado local, com retomada derivada dos timestamps já gravados:

1. **Estímulo** — introdução + "Situação k" + `texto_estimulo` + "Continuar".
   Ao entrar grava `vinheta_exibida_em` (upsert cria a linha); ao clicar grava
   `vinheta_continuar_em`.
2. **Áudio** — `TocadorAudio`:
   - áudio presente: `<audio src=URL pública>` toca ao entrar (gesto do clique
     anterior habilita autoplay). "Continuar" aparece no evento `ended`; link
     "já ouvi, continuar" após 10 s. Grava `audio_iniciado_em`,
     `audio_terminado_em`, `audio_duracao_ouvida_seg` (via `timeupdate` / ao
     sair), `audio_completou`.
   - áudio ausente: aviso "o áudio desta situação ainda não está disponível" +
     "Continuar" imediato; timestamps de áudio ficam nulos.
3. **Avaliação** — `AvaliacaoPosImaginacao` (form condicional). Ao entrar grava
   `avaliacao_iniciada_em`. "Concluir": verificação de branco (mesmo hook de C)
   → grava respostas + `avaliacao_enviada_em` + `completado_em`; avança a
   posição (ou vai para `encerramento` após a 10ª).

Autosave por campo na avaliação (upsert parcial em `vignette_responses`), como
no sociodemográfico.

### Avaliação pós-imaginação — questões e desvios

Página única com visibilidade condicional (skip = esconder bloco):

| Q | Campo(s) | Tipo | Aparece se |
|---|---|---|---|
| 1 | `q1_imersao` | 0–10 | sempre |
| 2a | `q2_emocao_aberta` | texto (1 palavra) | `q1_imersao > 0` |
| 2b | `q2_emocao_categoria` (+`q2_emocao_outra`) | rádio 8 + "Outra" | `q1_imersao > 0` |
| 3a | `q3_intensidade` | 0–10 | `q1_imersao > 0` |
| 3b | `q3_matriz` | matriz 8 emoções 0–10 | `q1_imersao > 0` **e** `q3_intensidade > 0` |
| 4 | `q4_valencia_emocional` | −5..+5 | `q1_imersao > 0` |
| 5 | `q5_desconforto` | 0–10 | `q1_imersao > 0` |
| 6 | `q6_pensamento_automatico` | texto | `q1_imersao > 0` |
| 7 | `q7_imagem_espontanea` | rádio sim/nao/nao_tenho_certeza | sempre |
| 8 | `q8_vividez` | 0–10 | `q7 = 'sim'` |
| 9 | `q9_perspectiva` (+`q9_perspectiva_outra`) | rádio 5 + "Outra" | `q7 = 'sim'` |
| 10 | `q10_valencia_imagem` | −5..+5 | `q7 = 'sim'` |
| 11 | `q11_conteudo_imagem` | texto longo | `q7 = 'sim'` |
| 12a | `q12_tendencia_aberta` | texto | sempre |
| 12b | `q12_matriz` | matriz 7 + "Outra" (rótulo + 0–10) | sempre |

Regras derivadas: Q1 = 0 esconde 2–6 (efetivo "pula para Q7"); Q3 = 0 esconde
3b (matriz); Q7 ≠ "sim" esconde 8–11. `normalizarRespostas` limpa o que ficou
escondido antes de gravar (padrão de C).

Escala categórica Q2b: `ansiedade, culpa, tristeza, raiva_irritacao, vergonha,
medo, tensao, frustracao, outra`. Q9: `proprios_olhos, observador, alternava,
outra, nao_identifico`. Tendências Q12: `atender, expressar, evitar, silencio,
explicar, afastar, criticar_se` + `outra`.

### Encerramento (`etapa = encerramento` / `concluido`)

`Encerramento.tsx`: ao montar, se `etapaAtual === 'encerramento'` chama
`supabase.rpc('concluir_participacao')` e `recarregar()`. Renderiza
`DocumentoRenderizado slug="encerramento"`. `rotaDaEtapa('concluido')` já aponta
para cá. `EntrarComToken`: convite `concluido` → 409 → mensagem "participação já
concluída" (comportamento atual, sem mudança).

### Painel — `Audios.tsx` (`/painel/estudos/:studyId/audios`)

Lista as 10 vinhetas (`vignettes` filtradas por `study_id`, com `id`,
`titulo_interno`, `dominio` — visível só para a equipe). Para cada: player do
áudio atual (se houver, via `audios_participante` ou path direto) + `<input
type=file accept="audio/*">`. Upload → Storage (`upsert`) + upsert
`audio_assets`. Item novo na `Sidebar` (`{ to: "audios", rotulo: "Áudios" }`).

## Tratamento de erros

- RPC `gerar_ordem_vinhetas` falha → "não foi possível iniciar a tarefa agora"
  + "tentar de novo"; não avança a etapa.
- Áudio 404 / erro de rede no `<audio>` → trata como ausente (aviso + continuar).
- Autosave da avaliação falha → estado "não salvo", retry no próximo save e no
  "Concluir" (só avança após flush ok) — padrão de C.
- `concluir_participacao` falha no encerramento → tela ainda mostra o texto de
  encerramento; retenta no próximo carregamento. Não trava o participante.

## Testes (`tests/unit`)

- `avaliacaoPosImaginacao`: visibilidade para cada ramo — Q1=0 (só 1, 7, 12),
  Q1>0 completo, Q3=0 (sem matriz), Q7='sim' (8–11 visíveis), Q7='nao'/'nao
  tenho certeza' (pula para 12); `normalizarRespostas` limpa campos escondidos.
- `vinhetasFluxo.posicaoAtual`: 0 concluídas → posição 1; k concluídas → k+1;
  10 concluídas → sinaliza fim; respeita a ordem sorteada (não o id).
- `EscalaNumerica`: 0–10 e −5..+5 renderizam os pontos certos e propagam valor
  (inclui o 0 e os negativos como valores válidos, não "branco").
- `MatrizEmocoes`: uma linha por emoção; valor por linha isolado.
- Contagem de branco na avaliação ignora questões escondidas pelo desvio.
- RLS (`tests/rls`, quando houver Supabase): `gerar_ordem_vinhetas` cria 10
  linhas idempotentes; participante não lê ordem/resposta de outro.

## Fora de escopo / YAGNI

- Sem pré-carregar (preload) os 10 áudios; carrega o da vinheta atual.
- Sem re-sorteio de ordem, sem "voltar uma vinheta".
- Sem player customizado além do `<audio controls>` do navegador + o gating.
- `q3_matriz` e `q12_matriz` como `jsonb` livre — sem tabela normalizada
  (uma linha por vinheta já basta; exportação trata o jsonb em E).
