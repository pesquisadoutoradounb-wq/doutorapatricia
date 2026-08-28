# Sub-projeto A — Fundação · Design

**Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental (UnB)**
Data: 2026-08-27 · Status: aprovado para implementação

---

## Contexto

Plataforma web de coleta de dados para pesquisa de doutorado em Psicologia. Dois
públicos totalmente separados:

- **Participantes** — objeto do estudo. Acessam só pelo link único de convite,
  sem conta. Toda a experiência é a sequência de telas de pesquisa.
- **Equipe de pesquisa** — login real (Supabase Auth) para o painel
  administrativo. Nunca passam pelo fluxo do participante (usam "modo piloto"
  com link de convite de teste quando precisam testar).

O projeto foi decomposto em sub-projetos A–E. Este documento cobre **A**, a
fundação: scaffold, modelo de dados completo + RLS, modelo de sessão do
participante, CI/CD, tokens de tema. **A não implementa nenhum conteúdo de
instrumento** (isso é B/C/D) nem o painel além de um shell autenticado (E).

## Decisões

| Tema | Decisão |
|---|---|
| Stack front | Vite + React + TypeScript, HashRouter, deploy estático em GitHub Pages |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions em Deno) |
| E-mail | Brevo, só a partir de Edge Functions; API key como secret |
| Repositório | `pesquisadoutoradounb-wq/doutorapatricia` (**público**) |
| Endereço | `https://pesquisadoutoradounb-wq.github.io/doutorapatricia/` (domínio padrão) |
| Conteúdo sensível | Instrumentos (pré-CEP, sensíveis a efeito de expectativa) **ficam fora do repo**: `docs/fonte-metodologia/` gitignorado; textos e vinhetas vivem só no Supabase, servidos em runtime com sessão de participante. O bundle não contém texto de instrumento. |
| Sessão do participante | **Opção A**: Supabase Anonymous Auth + claim `app_metadata.participant_id` gravado por Edge Function; RLS declarativo. Migração para "sem acesso direto ao banco" (Opção C) é possível sem refazer o modelo de dados, se o CEP exigir. |
| Identidade visual | **PENDENTE (PERGUNTAR 25)** — default "neutra" com menção à UnB; `config.identidade` trocável sem retrabalho |

## Estrutura do repositório

```
.github/workflows/   deploy-pages.yml · supabase-deploy.yml
docs/                fonte-metodologia/ (gitignore) · marca/ (gitignore) · superpowers/specs/
public/              404.html · .nojekyll
src/
  main.tsx · App.tsx (HashRouter, duas árvores: /participar/* e /admin/*)
  lib/       config.ts · supabase.ts · participantSession.ts · adminAuth.ts · documentos.ts
  components/ StudyHeader · ParticipanteLayout (rodapé fixo de desconforto) · AdminLayout · DocumentoRenderizado
  routes/participar/  EntrarComToken · EtapaPlaceholder · Encerramento · PaginaDesconforto
  routes/admin/       AdminLogin · AdminHome · RequireAdmin
  styles/    tokens.css (claro/escuro, AA, baixa ativação) · base.css
supabase/
  config.toml
  migrations/ 0001 enums · 0002 tabelas · 0003 funções RLS · 0004 policies · 0005 views · 0006 triggers · 0007 storage
  functions/  _shared/ · iniciar-participacao · vincular-sessao · send-invite (stub) · brevo-webhook (stub)
  seed.example.sql (placeholders, versionado) · seed.local.sql (real, gitignore)
tests/
  unit/  config · participantSession · routing
  rls/   rls.test.ts (integração; pulado sem SUPABASE_TEST_*)
```

## Modelo de dados

Enums: `admin_role`, `invite_status`, `participant_mode`, `participant_step`,
`consent_decision`, `email_event_type`.

Tabelas (todas com RLS habilitado; sem política = negado; `anon` sem acesso):

- `research_admins` — equipe (liga a `auth.users`), papel admin/colaborador/leitura
- `invites` — e-mail, nome, token uuid, status, modo, expira_em, auditoria de acesso; **sem acesso de participante**
- `participants` — pseudônimo, `invite_id` (unique), `etapa_atual`, `auth_user_id`
- `study_documents` — textos versionados (TCLE, informações, instruções, encerramento, desconforto); um ativo por slug
- `consent_records` — snapshot imutável do TCLE + decisão (append-only via trigger)
- `sociodemographic_responses` — uma linha/participante, uma coluna/item; "Prefiro não responder" = string, nunca null
- `ysq_item_responses` (1–90, valor 1–6) + `ysq_completions`
- `panas_item_responses` (1–19, valor 1–5) + `panas_completions`
- `vignettes` — id 1–10, `dominio`/`titulo_interno`/`conteudo_predominante` **só admin**; `texto_estimulo`
- `audio_assets` — bucket Storage `audios`
- `vignette_order` — ordem sorteada e persistida por participante (gerada uma vez pelo servidor)
- `vignette_responses` — avaliação pós-imaginação (Q1–Q12) + campos de tempo
- `email_events` — payload bruto do webhook do Brevo

Funções auxiliares (`security definer` onde aplicável): `current_participant_id()`
(lê o claim do JWT), `is_admin()`, `admin_role()`, `admin_pode_escrever()`.

Views seguras (rodam com privilégio do dono, expõem só colunas não sensíveis):
`documentos_estudo_publico`, `vinhetas_participante` (id + texto, **sem** domínio/título),
`audios_participante`.

Triggers: `consent_records` imutável; `etapa_atual` monotônica (não retrocede,
não pula — impede pular instrumentos); touch de `atualizado_em`.

## Modelo de sessão do participante

1. `/participar/:token` → `iniciar-participacao` (sem JWT) valida o convite,
   registra IP/User-Agent + `primeiro_acesso_em`, cria/recupera `participants`
   (idempotente por `invite_id`). Retorna `{ participant_id, etapa_atual, modo }`.
2. Se não há sessão anônima ligada a este participante: `signInAnonymously()` →
   `vincular-sessao` (com o JWT anônimo) revalida o token e grava
   `app_metadata.participant_id` no usuário anônimo → `refreshSession()`.
3. O JWT passa a carregar `participant_id`; o RLS restringe tudo às linhas
   daquele participante.

Retomada: sessão persistida em localStorage; reabrir o link recria a sessão
ligada ao **mesmo** `participant_id`. Token inválido/expirado/concluído →
mensagem apropriada (nunca erro técnico).

Tokens inválidos retornam 400/404 → "Convite não reconhecido"; expirado → 410;
já concluído → 409.

## CI/CD

- `deploy-pages.yml` (push main): `npm ci` → `typecheck` → `test` → `build`
  (com `VITE_*` de secrets) → deploy Pages.
- `supabase-deploy.yml` (push main tocando `supabase/**`): `supabase link` →
  `db push` → `functions deploy`.

## Testes

- **Unitários** (vitest/jsdom): config, helpers de sessão, separação de rotas
  (participante vê estado de verificação e rodapé de desconforto; admin vê área
  restrita).
- **RLS** (integração, `npm run test:rls` após `supabase start`): participante
  não lê/escreve dados de outro; anon não lê nada; participante não vê `invites`;
  `consent_records` imutável; `etapa_atual` não pula.

## Fora de escopo (sub-projetos seguintes)

B: informações gerais, TCLE + consentimento + PDF. C: sociodemográfico, YSQ-S3,
PANAS. D: instruções, randomização/telas de vinheta/áudio, avaliação
pós-imaginação, encerramento, tempos. E: painel (convites, CSV, Brevo, dashboard,
exportações, toggle piloto/produção).

## Pendências de decisão (PERGUNTAR)

Rastreadas no README, seção "Pendências". Nenhuma bloqueia A; várias bloqueiam
B/C/D. Itens 1, 2, 4, 6, 7, 9–13, 16, 17, 19–23, 25.
