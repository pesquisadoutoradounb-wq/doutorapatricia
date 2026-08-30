# Sub-projeto E1 — Recrutamento & operação · Design

**Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental (UnB)**
Data: 2026-08-29 · Status: aprovado para implementação

---

## Contexto

O fluxo do participante (A–D) está completo. Falta o lado operacional para
**recrutar**: criar convites, enviar os e-mails (Brevo), acompanhar o retorno e
não deixar dados de teste contaminarem a análise. O sub-projeto E foi
decomposto em E1 (este), **E2** (exportações) e **E3** (pontuação & resultados).

Estruturas já existentes: `invites` (com `modo`, `token`, `status`, `expira_em`,
`enviado_em`, `criado_por`), `email_events` (enum `email_event_type`), Edge
Functions **stub** `send-invite` e `brevo-webhook`, telas-esqueleto `Convites` /
`Participantes` / `Exportar`, `carregarMetricas` para o dashboard.

## Escopo

**Entra:**
- `send-invite` completo: cria convites (individual / lote / CSV) e dispara o
  e-mail transacional pelo Brevo, renderizando um HTML editável no painel.
- `brevo-webhook` completo: mapeia os eventos do Brevo para `email_events`,
  ligados ao convite por *tag*.
- Tela **Convites**: adicionar (colar e-mails ou CSV), lista com status,
  reenviar, definir/estender expiração, excluir; botão "gerar link de teste".
- Tela **Participantes**: lista pseudônima (modo, etapa, progresso, tempos);
  ações "reenviar convite" e "marcar como descartado".
- **Piloto × produção**: padrão = só produção nos dashboards, em Participantes e
  (E2) nas exportações; alternador visível para incluir pilotos. Descartados
  saem da visão de produção.
- Migration `0014` (colunas de descarte + RPCs) + documento `convite_email`.

**Fica de fora:** exportação de dados (E2); pontuação/dashboards de resultado
(E3); gestão de contas de equipe (já em `Equipe`); apagar dados de participante
(decisão do CEP — não nesta fase).

## Decisões (brainstorming 2026-08-29)

| Tema | Decisão |
|---|---|
| Corpo do e-mail | **HTML editável no painel**, `study_documents` slug `convite_email`, com placeholders `{{nome}}` e `{{link}}`. `titulo` do documento = assunto do e-mail. `send-invite` renderiza e envia pelo endpoint transacional do Brevo. |
| Participantes | Ações: **reenviar convite** e **marcar como descartado** (flag, não apaga). |
| Piloto/produção | Padrão = **só produção**; alternador visível inclui pilotos. "Gerar link de teste" cria um convite `piloto` sem enviar e-mail. |
| Vínculo evento↔convite | `send-invite` envia com `tags: ["<invite_id>"]`; o webhook lê `payload.tags[0]`. |
| Status do convite | A escada `enviado → aberto → iniciado → concluido → expirado` é dirigida pela plataforma (`send-invite`, `iniciar-participacao`, `concluir_participacao`, `validarConvite`). O webhook **não altera** `invites.status` — só alimenta `email_events` (camada de entrega: entregue / aberto-email / clicado / bounce / spam). |

## Modelo de dados

### Migration `0014_recrutamento.sql`

```sql
alter table public.participants
  add column if not exists descartado      boolean not null default false,
  add column if not exists descartado_em   timestamptz,
  add column if not exists descartado_por  uuid references auth.users (id) on delete set null,
  add column if not exists descartado_nota text;

create index if not exists participants_descartado_idx
  on public.participants (study_id) where not descartado;
```

**RPC `definir_descarte(p_participant uuid, p_descartado boolean, p_nota text)`**
— `security definer`; exige `admin_pode_escrever()`; seta/limpa as colunas de
descarte. (Evita alargar os grants de coluna de `participants`, hoje restritos a
`etapa_atual`.)

**RPC `criar_convite_piloto(p_study uuid)`** — `security definer`; exige
`admin_pode_escrever()`; insere um `invites` com `modo='piloto'`,
`status='enviado'`, e-mail sintético (`piloto+<n>@teste.local`), retorna a linha
(o painel monta o link). Não envia e-mail.

### `study_documents` — novo slug

`convite_email` entra em `SLUGS_DOCUMENTO` (editor do painel) e no
`SlugDocumento`. Seed (`gerar-seed-local` + `seed.example`): rascunho com
`{{nome}}` / `{{link}}` e assunto "Convite para participar de uma pesquisa da UnB".

## Edge Functions

### `send-invite` (verify_jwt = true)

Entrada (uma das formas):
```
{ study_id, convites: [{ email, nome? }], expira_em?, modo? }   // criar + enviar
{ reenviar_invite_id }                                          // reenviar
```
Fluxo:
1. Autentica (JWT) + `rpc('admin_pode_escrever')` → senão 403.
2. **Criar**: para cada `{email,nome}`: se já existe convite para `(study_id,
   email)` não-concluído, reaproveita; senão `insert invites (...) returning`.
   `modo` default `producao`; `expira_em` default now + 30 dias.
3. **Reenviar**: carrega o convite; `status='enviado'`, `enviado_em=now`,
   estende `expira_em`.
4. Renderiza o HTML: carrega `convite_email` ativo do estudo; substitui
   `{{nome}}` (ou "participante") e `{{link}}` =
   `${APP_BASE_URL}/#/participar/${token}`.
5. `POST https://api.brevo.com/v3/smtp/email` com header `api-key: BREVO_API_KEY`,
   `sender { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL }`,
   `to [{ email, name }]`, `subject` = título do documento, `htmlContent`,
   `tags: [invite_id]`.
6. Sucesso → grava `email_events (invite_id, tipo:'enviado', payload)`;
   erro → mantém o convite e devolve o motivo por e-mail.
7. Retorno: `{ criados, enviados, erros: [{ email, motivo }] }`.

Secrets novos: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`,
`APP_BASE_URL`. Sem `BREVO_API_KEY` a função responde 501
`brevo_nao_configurado` e **não** cria convites (evita convite órfão sem e-mail).

### `brevo-webhook` (verify_jwt = false, segredo em `?s=`)

Mapeia `payload.event`: `request→enviado`, `delivered→entregue`,
`opened|unique_opened→aberto`, `click→clicado`,
`hard_bounce|soft_bounce|blocked|invalid_email→bounce`,
`spam|unsubscribed→spam`, resto → `outro`. `invite_id` = `payload.tags?.[0]`
(valida UUID). Insere em `email_events`. Idempotência best-effort (evento
repetido = nova linha; aceitável para log).

## Frontend

```
src/lib/convitesAdmin.ts
  listarConvites(studyId, { incluirPiloto })      -> ConviteAdmin[]
  parseCsvConvites(texto)                          -> { linhas: {email,nome}[], erros: string[] }
  criarConvites(studyId, convites, opts)           -> chama send-invite
  reenviarConvite(inviteId)                        -> send-invite
  gerarLinkTeste(studyId)                          -> rpc criar_convite_piloto  -> { link }
  excluirConvite(inviteId)

src/lib/participantesAdmin.ts
  listarParticipantes(studyId, { incluirPiloto, incluirDescartados })
  definirDescarte(participantId, descartado, nota) -> rpc
  (reenviar usa convitesAdmin via invite_id do participante)

src/components/painel/AlternadorModo.tsx           toggle "incluir pilotos"
src/routes/painel/Convites.tsx                     (substitui o stub)
src/routes/painel/Participantes.tsx                (substitui o stub)
```

- **Convites.tsx**: bloco "Adicionar" (textarea de e-mails, 1 por linha ou
  `email, nome`; ou upload de `.csv`), campo de expiração, botão "Enviar
  convites"; resultado (criados/enviados/erros). Tabela: e-mail, nome, modo,
  status, enviado em, expira em, ações (reenviar, copiar link, excluir).
  Botão "Gerar link de teste" → cria piloto e mostra o link para copiar.
  `AlternadorModo` controla se pilotos aparecem.
- **Participantes.tsx**: tabela `participant_id` curto, modo, etapa (rótulo),
  criado/concluído, tempo total (se concluído), descartado. Ações: "reenviar
  convite", "descartar / restaurar" (com nota). `AlternadorModo` +
  checkbox "mostrar descartados".
- **`carregarMetricas(studyId, { incluirPiloto })`**: filtra
  `modo='producao' and not descartado` por padrão; `incluirPiloto` inclui
  pilotos (nunca os descartados). Novo painel pequeno "E-mails" (entregues /
  aberturas / bounces) a partir de `email_events`. Dashboard ganha o
  `AlternadorModo` no topo.

## Segurança / privacidade

- `invites` (e-mail/nome) só é lido por `is_admin()` (RLS já existe). As telas
  de Convites mostram e-mail; **Participantes nunca mostra e-mail/nome** — só o
  pseudônimo e o progresso.
- O webhook não é autenticado pelo Brevo → segredo em `?s=` (já implementado).
- `APP_BASE_URL` e credenciais Brevo são secrets de function, nunca no bundle.

## Tratamento de erros

- Brevo fora do ar / 4xx: `send-invite` devolve `erros[]` por e-mail; o painel
  lista quais falharam e permite reenviar. Convites já criados não são
  apagados; ficam `status='enviado'` só após o envio confirmado (senão
  permanecem sem `enviado_em`, sinalizados na tabela como "não enviado").
- CSV malformado: `parseCsvConvites` devolve `erros[]` com o número da linha;
  as linhas válidas seguem.
- RPC sem permissão: mensagem "sem permissão de escrita" (papel `leitura`).

## Testes (`tests/unit`)

- `parseCsvConvites`: `,` e `;` como separador; com e sem cabeçalho; linha só
  com e-mail; e-mail inválido vira erro; nome com vírgula entre aspas.
- `carregarMetricas`: exclui `modo='piloto'` e `descartado` por padrão; inclui
  pilotos com a flag; nunca inclui descartados.
- Formatação do tempo total do participante (criado → concluído).
- Mapa de evento Brevo → `email_event_type` (função pura extraída para
  `_shared`).
- RLS (`tests/rls`): `definir_descarte` exige admin; participante não enxerga
  `invites`.

## Fora de escopo / YAGNI

- Sem agendamento de envio, sem lembretes automáticos.
- Sem editor visual de e-mail (é textarea de HTML, como os outros documentos).
- Sem paginação nas tabelas (dezenas a centenas de linhas; ordena no cliente).
- Sem reconciliação retroativa de `email_events` órfãos.
