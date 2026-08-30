# Recusa de convite + e-mail de convite em HTML · Design

**Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental (UnB)**
Data: 2026-08-30 · Status: aprovado para implementação · Extensão do sub-projeto E1

---

## Contexto

E1 (recrutamento) já entrega: criação de convites, envio transacional pelo Brevo
renderizando o documento editável `convite_email` (`{{nome}}` / `{{link}}`),
webhook do Brevo alimentando `email_events`, telas Convites/Participantes, e o
funil do dashboard.

Já é possível, com os dados existentes, distinguir cada convidado:

| Estado | Como se deriva hoje |
|---|---|
| Não abriu o e-mail | `invites.status = 'enviado'` **e** sem `email_events (tipo='aberto')` |
| Abriu o e-mail, não acessou o link | tem `email_events (tipo='aberto')`, `invites.primeiro_acesso_em` nulo |
| Acessou / começou, não finalizou | `invites.status IN ('aberto','iniciado')` / `primeiro_acesso_em` preenchido / participante não `concluido` (inclui `interrompido`) |
| Finalizou | `invites.status = 'concluido'` |

Falta **um estado**: o convidado que declara não ter interesse. E o corpo do
e-mail hoje é uma sequência de `<p>` sem identidade visual.

## Escopo

**Entra:**
- Novo estado `recusou` em `invite_status` + coluna `invites.recusado_em`.
- Edge Function pública `recusar-convite` (token, sem JWT), idempotente.
- Rota `/#/recusar/:token` (zona do participante) que registra a recusa em 1
  clique (POST via JS — à prova de pré-fetch de cliente de e-mail).
- `send-invite`: `renderCorpo` passa a expor `{{link}}` e `{{link_recusa}}` como
  URL crua escapada; novo placeholder `{{link_recusa}}`.
- `validarConvite` + `EntrarComToken`: convite `recusou` → mensagem própria.
- Painel: `recusou` em Convites (`ROTULO_STATUS`/`TOM_STATUS`) e em
  `painelMetricas` (`porStatus` + KPI "Recusaram"); coluna "E-mail" na tabela de
  Convites (selo `aberto` / `entregue` / `—`).
- Novo corpo HTML do documento `convite_email`, identidade da plataforma,
  compatível com clientes de e-mail (tabela + estilos inline).
- `config.toml`: `[functions.recusar-convite] verify_jwt = false`.

**Fica de fora:**
- "Não tenho interesse" dentro do fluxo do participante (1ª tela) — rodada
  futura; o mecanismo (função + status) já fica pronto para reaproveitar.
- Reversão da recusa pelo próprio convidado (é manual, pelo admin).
- Campo de motivo da recusa.
- Contato/CEP e duração real do estudo no e-mail — entram como colchetes
  editáveis `[X]` / `[CONTATO/CEP]`.

## Decisões (brainstorming 2026-08-30)

| Tema | Decisão |
|---|---|
| Recusa UX | **1 clique + confirmação**: a rota `/#/recusar/:token` faz um POST no `onMount`; mostra "registrando…" e depois a confirmação. Sem botão extra. |
| Robustez a pré-fetch | A mutação é um `POST` disparado por JavaScript, não um efeito de GET. Scanners/antivírus que só fazem `GET` na URL não disparam recusa. |
| Identidade do e-mail | **UnB + nome da pesquisadora.** Faixa `#1a3852`, filete `#b8912f`, assinatura "Patrícia Galvão — pesquisadora responsável · Doutorado em Psicologia Clínica e Cultura, UnB". |
| Reversão | Convite `recusou` **não** deixa o convidado entrar pelo link de participação. `EntrarComToken` mostra "se mudou de ideia, fale com a equipe". Admin reverte manualmente (mudar `status`, ou reenviar). |
| `{{link}}` | Passa a renderizar como **URL crua escapada** (hoje vira `<a>`). O template controla o `<a href>`. Migração: trocar o `convite_email` ativo ao publicar. |
| Recusa × email_events | A recusa grava `email_events (tipo:'outro', payload:{evento:'recusa'})` além de `invites.status`. Coerente com E1 (webhook alimenta a camada de entrega; a escada de status é da plataforma). |

## Modelo de dados

### Migration `0015_recusa_convite.sql`

```sql
-- Postgres não permite usar um valor de enum recém-criado na mesma transação.
-- Isolado, como o 0011 fez com 'inelegivel'/'interrompido'.
alter type public.invite_status add value if not exists 'recusou';

alter table public.invites
  add column if not exists recusado_em timestamptz;
```

Sem novo índice (consulta por `status` já coberta por `invites_status_idx`).
Sem mudança de RLS: `invites` não tem acesso de participante; a função usa
`service_role`.

## Edge Function `recusar-convite`

`config.toml`: `verify_jwt = false` (convidado não tem sessão).

```
POST  { token: string }

1. token não-UUID           -> 400 { erro: "token_invalido" }
2. convite inexistente      -> 404 { erro: "token_invalido" }
3. status = 'concluido'     -> 409 { erro: "ja_concluido" }
4. status = 'recusou'       -> 200 { ok: true, ja_recusado: true }   (idempotente)
5. senão:
   update invites set status='recusou', recusado_em=now() where id=?
   insert email_events (invite_id, tipo:'outro', payload:{evento:'recusa', via:'email'})
   -> 200 { ok: true }
```

- Reaproveita `validarConvite`? Não diretamente — `validarConvite` rejeita
  expirado (`410`) e trata regras de retomada que não valem aqui. A função faz a
  sua própria checagem mínima (UUID + busca + `status`). Um convite **expirado**
  ainda pode ser recusado (o convidado só quer parar de receber contato).
- Não retorna e-mail/nome. CORS via `_shared/cors.ts`. `OPTIONS` → 200.
- Sem rate-limit dedicado (a superfície é 1 UUID aleatório por convite; abuso
  não vaza dado nem cria carga relevante).

## `send-invite`

`renderCorpo(html, nome, link, linkRecusa)`:

```ts
return html
  .split("{{nome}}").join(escapeHtml(nome || "participante"))
  .split("{{link}}").join(escapeHtml(link))
  .split("{{link_recusa}}").join(escapeHtml(linkRecusa));
```

`linkRecusa = `${appUrl}/#/recusar/${token}``. Calculado nos dois caminhos
(criar+enviar e reenviar), ao lado do `link` que já existe.

**Regressão conhecida:** um `convite_email` que hoje tenha `{{link}}` sozinho
numa linha deixa de virar hyperlink. Mitiga-se publicando o corpo novo (abaixo)
junto com o deploy. Documentar no CHECKLIST-PUBLICACAO.

## Frontend

```
src/lib/recusaConvite.ts                       recusarConvite(token)
  -> { ok:true; jaRecusado?:boolean } | { ok:false; motivo }
  invoke("recusar-convite", { body:{ token } })  (sem auth)
src/routes/participar/RecusarConvite.tsx        rota nova
src/App.tsx                                     <Route path="recusar/:token"> em /participar
src/routes/participar/EntrarComToken.tsx        + mensagem "convite_recusado"

supabase/functions/recusar-convite/index.ts    função nova
supabase/functions/_shared/emailConvite.ts     renderCorpo extraído de send-invite (p/ teste)
supabase/functions/send-invite/index.ts        usa _shared/emailConvite; calcula link_recusa
supabase/functions/_shared/convite.ts          validarConvite: status 'recusou' -> motivo:'recusado'
supabase/functions/iniciar-participacao/index.ts  mapeia motivo 'concluido'|'recusado'
supabase/config.toml                           [functions.recusar-convite] verify_jwt = false
```

### `RecusarConvite.tsx`

- Renderiza dentro do `ParticipanteLayout` (zona clara e calma), com a casca
  padrão (cabeçalho do estudo + rodapé de desconforto) — sem exceção.
- `useEffect` on-mount, guarda `useRef` contra StrictMode (padrão do
  `EntrarComToken`): chama `recusarConvite(token)`.
  - ok / jaRecusado → cartão: **"Registramos que você não deseja participar."**
    "Não enviaremos novos contatos sobre este estudo. Se isso foi um engano ou
    você mudar de ideia, entre em contato com a equipe de pesquisa."
  - `ja_concluido` → "Suas respostas já foram concluídas. Não há o que recusar."
  - erro de rede → "Não foi possível registrar agora." + botão "Tentar de novo".
- `useTituloAba("Convite")`.

### `EntrarComToken` / `validarConvite`

`validarConvite`: se `convite.status === 'recusou'` → `{ ok: false, status: 409 }`
com um discriminador novo, **ou** um status HTTP próprio. Decisão: reusar `409`
e o `iniciar-participacao` mapeia para um erro novo `convite_recusado`
(hoje `409 -> "ja_concluido"`). Precisa distinguir os dois casos de 409 →
`validarConvite` passa a devolver `{ ok:false, status:409, motivo:'concluido'|'recusado' }`
e `iniciar-participacao` mapeia o `motivo`.

`EntrarComToken.mensagens`:
```
convite_recusado: {
  titulo: "Convite recusado",
  corpo: "Você indicou anteriormente que não deseja participar desta pesquisa.
          Se mudou de ideia, entre em contato com a equipe de pesquisa.",
}
```

### Painel

`src/routes/painel/Convites.tsx`
- `ROTULO_STATUS.recusou = "Recusou"`; `TOM_STATUS.recusou = "neutro"`.
- Nova coluna **"E-mail"** entre "Status" e "Enviado": selo do maior evento de
  entrega do convite — `aberto` (info) > `entregue` (neutro) > `—`.
  `listarConvites` passa a buscar `email_events (invite_id, tipo)` dos convites
  listados e reduz para `abriuEmail` / `entregouEmail` por convite. `ConviteAdmin`
  ganha `email_aberto: boolean`, `email_entregue: boolean`.

`src/lib/painelMetricas.ts`
- `ROTULO_STATUS.recusou = "Recusou"`; incluir `"recusou"` na lista de `porStatus`.
- `MetricasEstudo.recusaram: number` (contagem de `status='recusou'`).
- `telas.tsx`: KPI "Recusaram" na 1ª linha de KPIs.

## O e-mail (`convite_email`)

`titulo` do documento = assunto: **"Convite para participar de uma pesquisa de
doutorado da UnB"**.

Corpo: HTML de tabela, largura 600px, centrado, estilos **inline**, sem
`<style>`/webfonts (não sobrevivem a Gmail/Outlook). Preheader oculto.
Placeholders: `{{nome}}`, `{{link}}` (dentro de `href` e como texto para
copiar/colar), `{{link_recusa}}` (dentro de `href` da linha "Não tenho
interesse"). Colchetes editáveis: `[X]` (duração), `[CONTATO/CEP]`.

Estrutura:
1. **Preheader** oculto: "Convite para participar de uma pesquisa de doutorado da UnB."
2. **Faixa** `#1a3852`, texto branco serifado "PESQUISA DE DOUTORADO · UnB",
   filete `#b8912f` (2px) abaixo.
3. **Corpo** branco, `#21303d`, Arial/Helvetica ~15px/1.6:
   - "Olá, {{nome}}."
   - Convite: pesquisa de doutorado do PPG em Psicologia Clínica e Cultura da
     UnB, conduzida pela pesquisadora **Patrícia Galvão**.
   - Formato: on-line, individual, voluntária, ~`[X]` min, interrompível a
     qualquer momento; 1as telas trazem informações completas + TCLE.
   - **Botão** (`<a>` estilizado, `#2f6690` com borda `#b8912f`, texto branco):
     "Acessar minha participação" → `{{link}}`.
   - "Ou copie e cole este endereço no navegador:" + `{{link}}` em texto.
   - "Este link é pessoal e individual — não o compartilhe."
   - Divisória.
   - "Não tem interesse em participar? Avise-nos e não enviaremos novos
     contatos." + link "Não tenho interesse" → `{{link_recusa}}`.
4. **Rodapé** `#f2f5f9`, `#5c6b78` ~12px: assinatura da pesquisadora + linha
   institucional + "Dúvidas: responda a este e-mail · [CONTATO/CEP]".

O HTML final entra em `scripts/gerar-seed-local.py` (`CONVITE_EMAIL` deixa de ser
lista de parágrafos e passa a ser a string HTML) e no `seed.example.sql`
(placeholder curto atualizado).

## Sequência da recusa

```
convidado clica "Não tenho interesse" no e-mail
  -> Brevo registra 'click' (email_events tipo='clicado')      [já existe]
  -> abre /#/recusar/<token> no navegador
  -> RecusarConvite monta, POST recurar-convite { token }
       -> invites.status = 'recusou', recusado_em = now()
       -> email_events (tipo='outro', payload.evento='recusa')
  -> tela mostra confirmação
painel: Convites mostra "Recusou"; dashboard conta em "Recusaram" e em "por status"
```

## Deploy

Adicionar ao `docs/CHECKLIST-PUBLICACAO.md`:
1. `supabase db push` (migration `0015`).
2. `supabase functions deploy recusar-convite`.
3. `config.toml` com `[functions.recusar-convite] verify_jwt = false` (commit).
4. **Publicar o novo `convite_email`** (senão o `{{link}}` sozinho quebra) — via
   painel Documentos ou seed.
5. Redeploy do front (rota nova).

## Testes

- `tests/unit/recusaConvite.test.ts` — `recusarConvite` mapeia ok / ja_recusado /
  409 / erro de rede (mock do `supabase.functions.invoke`).
- Extrair `renderCorpo` (hoje inline em `send-invite/index.ts`, que tem
  `Deno.serve` e não é importável) para `supabase/functions/_shared/emailConvite.ts`
  — padrão do `_shared/brevoEventos.ts`, que já é testado por vitest.
  `tests/unit/emailConvite.test.ts`: `{{link}}` e `{{link_recusa}}` viram URL
  escapada; `{{nome}}` escapado; texto sem placeholder inalterado.
- `tests/unit/convite.test.ts` — `validarConvite` (com client mock) com
  `status='recusou'` → `{ ok:false, status:409, motivo:'recusado' }`; `concluido`
  continua `motivo:'concluido'`.
- `tests/unit/routing.test.tsx` — a rota `/#/recusar/x` monta sem erro técnico;
  as asserções atuais continuam passando.
- `painelMetricas` / `convitesAdmin` — testes existentes continuam verdes; se
  houver teste de `listarConvites`, cobrir a redução de `email_events`.

## Riscos

| Risco | Mitigação |
|---|---|
| Pré-fetch de link recusa acidental | Mutação por POST-JS, não GET. |
| `{{link}}` sozinho no doc de produção deixa de virar link | Passo explícito no checklist; publicar o corpo novo junto. |
| Enum novo em transação | Migration `0015` isolada, só o `add value`. |
| Dois casos de HTTP 409 confundidos | `validarConvite` devolve `motivo` discriminado. |
| Cliente de e-mail quebrar o layout | Tabela + inline styles + sem webfonts; testado no litmus/na conta real antes do envio em massa. |
