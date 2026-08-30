# Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental

Plataforma web de coleta de dados para pesquisa de doutorado em Psicologia
(Programa de Pós-Graduação em Psicologia Clínica e Cultura, Instituto de
Psicologia, Universidade de Brasília).

> **Instrumento científico.** A precisão do conteúdo dos instrumentos (TCLE,
> YSQ-S3, PANAS, sociodemográfico, vinhetas, avaliação pós-imaginação,
> encerramento) importa mais do que qualquer decisão de design. Nenhum texto de
> instrumento pode ser alterado sem sinalização — o protocolo ainda vai a
> comitê de ética.

## Dois públicos, nunca misturados

| | Participantes | Equipe de pesquisa |
|---|---|---|
| Acesso | link único de convite (`/#/participar/:token`), sem conta | login e-mail/senha (Supabase Auth) |
| Experiência | sequência de telas de pesquisa, do início ao encerramento | painel administrativo (`/#/admin`) |
| Dados | respostas de instrumentos, por `participant_id` pseudônimo | gestão de convites, status, exportação |

Rotas, componentes e tabelas deixam a separação explícita: `/participar/*` × `/admin/*`.

## Estado atual

Implementado (A → C):
- **A** Fundação: scaffold, roteamento com as duas árvores, modelo de dados +
  RLS, sessão do participante (Anonymous Auth + claim), CI/CD, tokens de tema.
- **A.2** Multi-estudo + casca ERP do painel (sidebar, seletor de estudo).
- **B** Informações gerais + TCLE + consentimento (snapshot imutável) + via em
  PDF + editor de documentos no painel. Dashboard gerencial.
- **C** Coleta dos instrumentos basais: sociodemográfico (com elegibilidade),
  YSQ-S3 (90 itens em blocos), PANAS, modal de abandono, estados terminais
  `inelegivel` / `interrompido`. Sem auto-score (peça posterior).
- **D** Tarefa experimental: instruções + sorteio da ordem das 10 vinhetas,
  bloco de vinhetas (estímulo → áudio → avaliação pós-imaginação condicional),
  captura de tempos, encerramento (fecha a participação). Painel: upload de
  áudio por vinheta.
- **E1** Recrutamento & operação: tela de Convites (colar/CSV, status, reenviar,
  link de teste), `send-invite` + `brevo-webhook` completos, tela de
  Participantes (pseudônima, reenviar, descartar), separação piloto/produção
  nos painéis. Requer os secrets do Brevo para o envio real.

**Próximo**: **E2** exportações anonimizadas (CSV/JSON); **E3** pontuação
(YSQ / PANAS) + dashboards de resultado. Ver `docs/superpowers/specs/`.

---

## Stack

- **Front-end**: Vite + React + TypeScript · HashRouter · GitHub Pages
- **Backend**: Supabase — Postgres + Auth + Storage (áudios) + Edge Functions (Deno)
- **E-mail**: Brevo, **somente** a partir de Edge Functions (API key = secret da Supabase)
- **Deploy**: GitHub Actions a cada push em `main`

## Pré-requisitos

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (para `supabase start` local)
- Conta GitHub com acesso ao repositório · projeto Supabase · conta Brevo

---

## Setup local

```bash
git clone https://github.com/pesquisadoutoradounb-wq/doutorapatricia.git
cd doutorapatricia
npm ci

cp .env.example .env.local
# preencha .env.local (ver "Variáveis de ambiente")
```

### Banco local

```bash
supabase start                 # sobe Postgres + Auth + Storage locais
supabase db reset              # aplica todas as migrations + seed.example.sql
```

Para carregar o conteúdo real dos instrumentos localmente (nunca versionado):

```bash
cp supabase/seed.example.sql supabase/seed.local.sql
# edite supabase/seed.local.sql com os textos reais, então:
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/seed.local.sql
```

### Rodar o front

```bash
npm run dev                    # http://localhost:5173
```

### Criar um usuário da equipe (admin)

Contas da equipe são criadas manualmente — não há auto-cadastro.

1. Supabase Studio → **Authentication → Add user** (e-mail + senha).
2. Copie o `user id` gerado.
3. No SQL Editor:
   ```sql
   insert into public.research_admins (user_id, nome, papel)
   values ('<user-id>', 'Nome da pessoa', 'admin');  -- ou 'colaborador' / 'leitura'
   ```

---

## Variáveis de ambiente

Nenhum valor real é versionado. Nomes:

### Build do front (`.env.local`; em produção, GitHub Actions Secrets)

| Nome | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon (pública; acesso restrito por RLS). **Nunca** a service_role aqui. |
| `VITE_APP_BASE_URL` | URL pública da app, sem barra final |
| `VITE_APP_BASE_PATH` | Caminho base do Vite (produção: `/doutorapatricia/`) |
| `VITE_STUDY_MODE` | `piloto` ou `producao` (rótulo de UI) |

### Secrets da Supabase (`supabase secrets set …`; nunca no repo)

| Nome | Descrição |
|---|---|
| `BREVO_API_KEY` | API key do Brevo |
| `BREVO_SENDER_EMAIL` | Remetente verificado no Brevo |
| `BREVO_SENDER_NAME` | Nome de exibição do remetente |
| `BREVO_WEBHOOK_SECRET` | Segredo compartilhado para validar o webhook do Brevo |
| `APP_BASE_URL` | URL da app, para montar links de convite nos e-mails |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem
automaticamente dentro das Edge Functions.

### GitHub Actions — Secrets do repositório

| Nome | Descrição |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | token pessoal da Supabase CLI |
| `SUPABASE_DB_PASSWORD` | senha do banco do projeto |
| `SUPABASE_PROJECT_REF` | `svbcwxrgizyihhyxqtmj` |
| `VITE_SUPABASE_URL` | idem build |
| `VITE_SUPABASE_ANON_KEY` | idem build |

Variável (não secret): `VITE_STUDY_MODE`.

---

## Migrations

```bash
supabase migration new <nome>      # cria arquivo em supabase/migrations/
supabase db reset                  # local: recria o banco com todas as migrations
supabase db push                   # remoto: aplica migrations pendentes ao projeto linkado
```

Ordem atual: `0001` enums · `0002` tabelas · `0003` funções RLS · `0004`
policies · `0005` views de participante · `0006` triggers · `0007` storage ·
`0008` itens de instrumento (YSQ/PANAS/escalas + views) · `0009` multi-estudo ·
`0010` estudo público + consentimento · `0011` estados terminais do participante
(`inelegivel`/`interrompido`) + resultado de elegibilidade · `0012` transições
para os estados terminais · `0013` tarefa experimental (`q12_matriz` + RPCs
`gerar_ordem_vinhetas` / `concluir_participacao`) · `0014` recrutamento
(`participants.descartado` + RPCs `definir_descarte` / `criar_convite_piloto`;
`convite_email` fora da view pública).

O texto dos itens do YSQ-S3 e PANAS é conteúdo de instrumento: fica nas tabelas
`ysq_items` / `panas_items` / `instrument_scale_points` (só admin) e é servido ao
participante pelas views `*_participante`. Popule com:

```bash
python scripts/gerar-seed-local.py   # regenera supabase/seed.local.sql a partir de docs/fonte-metodologia/
```

Gerar tipos TypeScript do schema:

```bash
npm run gen:types                  # -> src/types/database.ts (local)
```

---

## Deploy

### Automático (GitHub Actions)

Push em `main`:

- **`deploy-pages.yml`** — build do front + deploy no GitHub Pages.
- **`supabase-deploy.yml`** — quando `supabase/**` muda: `db push` + `functions deploy`.

Pré-requisito único (uma vez): cadastrar os Secrets acima e rodar
`supabase secrets set` para os secrets das funções.

### Manual

```bash
# Front
npm run build
# publique o conteúdo de dist/ (ou use: gh workflow run deploy-pages.yml)

# Banco + funções
supabase link --project-ref svbcwxrgizyihhyxqtmj
supabase db push
supabase functions deploy
```

### GitHub Pages — configuração inicial (uma vez)

Repositório → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## Brevo — primeiros passos (a integração de envio entra no sub-projeto E)

1. Entre em <https://app.brevo.com> com `pesquisadoutorado.unb@gmail.com`.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: cadastre o
   e-mail remetente e confirme pelo link recebido. (Para melhor entregabilidade,
   depois autentique um domínio próprio em **Domains**.)
3. **SMTP & API → API Keys → Generate a new API key**. Guarde a chave — ela vai
   como `BREVO_API_KEY` em `supabase secrets set`, **nunca** no repositório nem
   no `.env` do front.
4. **Transactional → Settings → Webhook**: aponte para
   `https://svbcwxrgizyihhyxqtmj.functions.supabase.co/brevo-webhook?s=<BREVO_WEBHOOK_SECRET>`
   e marque os eventos: delivered, opened, clicked, hard bounce, soft bounce,
   spam. (Configuração final documentada no sub-projeto E.)

> **Não envie e-mails reais de teste para endereços verdadeiros sem confirmação
> explícita.** O modo piloto deve impedir disparos acidentais.

---

## Segurança — o que nunca fazer

- Não comitar a `service_role` key da Supabase, a senha do banco ou a
  `BREVO_API_KEY` — nem no repositório, nem no bundle do front.
- Não versionar `docs/fonte-metodologia/` nem `supabase/seed.local.sql`
  (instrumentos pré-CEP; risco de efeito de expectativa). Já no `.gitignore`.
- Não alterar o texto de nenhum instrumento sem sinalizar.

---

## Pendências de decisão (PERGUNTAR)

Levantadas na leitura dos arquivos-fonte; respostas da pesquisadora em
`Patricia/` (2026-08-29). ✅ = resolvida/implementada · 🔴 = ainda aberta.
Nenhuma 🔴 restante bloqueia a **coleta** (sub-projeto C, entregue); as que
sobram entram no sub-projeto D ou no auto-score.

### TCLE
1. ✅ Placeholders do TCLE entram como `[COLCHETES]` literais; o administrador
   preenche no painel (Documentos → TCLE).
2. ✅ Versionamento do TCLE: campo `versao` por documento, gerido no painel.
3. ✅ PDF da via — via `/participar/tcle/via` + diálogo de impressão do navegador
   (Salvar como PDF), sem enviar dados a terceiros.

### Sociodemográfico
4. ✅ Q8: "feração" → "federação"; campo = **lista das 27 UFs**; "Resido fora do
   Brasil" libera campo "País".
5. ✅ Q9: meta-frase do autor removida; salário mínimo **exibido no texto**
   (constante `SALARIO_MINIMO_REFERENCIA`, hoje `R$ 1.621,00`).
6. ✅ Q1 (idade) e Q8 (UF) **obrigatórias**. Q14: "Não sei informar" / "Prefiro
   não responder" são exclusivas dos checkboxes de diagnóstico.
7. ✅ Seção C: idade < 18 **ou** "Não" em Q15/Q17/Q18 → inelegível. Responde o
   questionário inteiro; avaliação só no "Concluir"; tela terminal
   `inelegivel` com a mensagem da pesquisadora. ("Não sei" em Q17 **não**
   reprova — default, confirmar.)
8. ✅ Campos condicionais aparecem só quando a opção-gatilho é marcada.

### YSQ-S3
9. ✅ 90 itens em `docs/fonte-metodologia/` (não é pendência); conferência final
   da transcrição automática ainda recomendada. Escala 1–6 e rótulos
   confirmados.
10. ✅ Ordem 1→90. Não se força resposta: mecanismo é o modal de abandono
    (item 19); apresentado em 9 blocos de 10.

### PANAS
11. ✅ Instrução reescrita para referência **"neste momento"** (sem "terapeuta").
12. ✅ 19 itens na ordem da transcrição, escala 1–5. Mapeamento item→subescala e
    faixas de classificação **pendente** (só bloqueia o auto-score, não a coleta).

### Vinhetas e áudio
13. ✅ 10 áudios distintos (um por vinheta). Roteiros prontos, **gravação
    pendente** (pesquisadora). Formato a propor: MP3 mono, ~128 kbps, curto
    (< ~3 min / < 5 MB).
14. ✅ Estímulo = só o parágrafo, com introdução "Leia atentamente a situação a
    seguir. Quando terminar, clique em 'Continuar'.". Tela: "Situação N" + texto
    + Continuar → play do áudio. Textos limpos em `vinhetas para plataforma.docx`.
15. ✅ IDs 1–5 = Domínio 1; 6–10 = Domínio 2 (só para análise). **Ordem das 10
    vinhetas randomizada** por participante.

### Avaliação pós-imaginação (entra em D — texto novo em `Patricia/avaliação pós imaginaçaõ plataforma.docx`)
16. ✅ Q7 "Não" **ou** "Não tenho certeza" → pula para Q12. Q8–11 só se "Sim".
17. ✅ Matriz secundária de 8 emoções (0–10) **entra**. "Não percebi uma emoção
    específica" **removida** da Q2. Q3 "nenhuma intensidade" → pula para Q4.
    Novo desvio: Q1 = "0 — Não consegui me imaginar" → pula para Q7.
18. ✅ Q2 tem as duas partes (aberta + categórica), sem "Não percebi". Q12 voltou
    como matriz completa (7 tendências + "Outra", 0–10) — `vignette_responses`
    precisa de `q12_matriz`.
19. ✅ Não se força resposta. Ao tentar avançar com 2+ respostas em branco na
    tela/bloco, aparece o modal "Deseja interromper sua participação?" — Cancelar
    volta às questões, "Sim" leva ao estado terminal `interrompido`. 1 em branco
    = aviso inline. Vale para todas as telas de instrumento. (Implementado em C
    para o sociodemográfico/YSQ/PANAS; a avaliação pós-imaginação herda em D.)
20. ✅ Captura de tempos implementada (timestamps de cada sub-tela + início/fim
    do áudio + duração ouvida + `audio_completou` + início/envio da avaliação).
    **Explicar em linguagem simples à pesquisadora** para confirmar (texto no
    spec de D).

### Páginas sem texto-fonte
21. ✅ "Informações gerais do estudo" — usar o texto do Anexo 9 como sugestão
    editável no painel (Documentos → informações gerais). Cadastrar lá.
22. ✅ "Desconforto durante a pesquisa" — mesmo conceito: sugestão editável no
    painel (Documentos → desconforto). Cadastrar lá.
23. ✅ Corpo do e-mail de convite (Brevo) — redigir rascunho para revisão (sem
    detalhar conteúdos dos esquemas). Detalhes por áudio com a pesquisadora.

### Identidade
25. 🔴 Identidade visual: UnB, "Vivant Psicologia" (consultório), ou neutra do
    estudo com menção à UnB? (a marca em `docs/marca/` é da Vivant; o TCLE afirma
    que a participação não é psicoterapia).

### Storage
- Bucket `audios` está **público** (sem PII, cacheável). Trocar para privado +
  URL assinada se o CEP pedir.
