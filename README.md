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

## Estado atual — sub-projeto A (fundação)

Implementado: scaffold, roteamento com as duas árvores separadas, modelo de
dados completo + RLS, modelo de sessão do participante (Anonymous Auth + claim),
CI/CD, tokens de tema, página de desconforto + rodapé fixo, shell do painel.

**Ainda não implementado** (próximos sub-projetos): conteúdo de todas as telas
de instrumento, TCLE/consentimento/PDF, randomização e telas de vinheta/áudio,
avaliação pós-imaginação, gestão de convites, dashboard, exportações, integração
Brevo. Ver `docs/superpowers/specs/`.

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
policies · `0005` views de participante · `0006` triggers · `0007` storage.

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

Levantadas na leitura dos arquivos-fonte. **Nenhuma bloqueia o sub-projeto A**;
as marcadas 🔴 bloqueiam B/C/D.

### TCLE
1. 🔴 Placeholders no texto-fonte a preencher: nome do orientador; duração
   estimada; e-mail/telefone da pesquisadora; e-mail do orientador; parágrafo de
   armazenamento/conservação/descarte; remuneração/ressarcimento; dados do
   CEP/CHS-UnB.
2. 🔴 Esquema de versionamento do TCLE (a fonte não tem número/data de versão).
3. Geração do PDF da via — proposta: client-side, sem enviar dados a terceiros.

### Sociodemográfico
4. 🔴 Q8: corrigir "feração" → "federação"? Campo = lista de UFs ou texto livre?
5. Q9: remover a meta-frase do autor ("Eu utilizaria faixas de renda…")? Salário
   mínimo fixo no texto ou parametrizável?
6. 🔴 Q1 (idade) e Q8 (UF) são obrigatórias (sem "Prefiro não responder" na
   fonte)? "Não sei informar"/"Prefiro não responder" na Q14 são mutuamente
   exclusivas das demais?
7. 🔴 Seção C (Q15–Q18): "Não" a internet/áudio/português encerra com mensagem
   de inelegibilidade ou só registra? Há idade mínima (18+)? Verificada onde?
8. Confirmar que os campos abertos condicionais aparecem só quando a opção
   correspondente é escolhida.

### YSQ-S3
9. 🔴 Conferir os 90 itens extraídos (`docs/fonte-metodologia/_transcricao-para-conferencia.md`)
   e confirmar escala 1–6 e rótulos.
10. 🔴 Ordem = 1→90 da fonte? Todos obrigatórios para avançar?

### PANAS
11. 🔴 A instrução-fonte diz "período indicado pelo terapeuta" — incorreto aqui.
    Qual período de referência ("neste momento"?) e como reescrever essa frase?
12. Confirmar 19 itens na ordem extraída e escala 1–5.

### Vinhetas e áudio
13. 🔴 São 10 áudios distintos (um por vinheta) ou 1 áudio genérico reutilizado?
    Já existem? Quem fornece? Formato/duração?
14. Confirmar que o estímulo é só o parágrafo após "Imagine a seguinte situação:",
    sem título/domínio, com a introdução "Leia atentamente a situação a seguir…".
15. IDs 1–5 = Domínio 1; 6–10 = Domínio 2 (ordem do documento).

### Avaliação pós-imaginação
16. 🔴 Q7 "Não tenho certeza" — comportamento indefinido na fonte (só o desvio de
    "Não" está especificado). Mostrar Q8–11, pular para Q12, ou subconjunto?
17. 🔴 Q3 — matriz secundária de 8 emoções (0–10): entra no piloto ou fica de
    fora (como a matriz da Q12)? Se Q2 = "Não percebi uma emoção específica", a
    Q3 ainda aparece?
18. Confirmar que a Q2 tem as duas partes (aberta + categórica de 10 opções).
19. 🔴 Campos abertos (Q2a, Q6, Q11, Q12a) são obrigatórios para avançar, ou o
    participante pode deixar em branco qualquer item? Vale para todas as telas.
20. Granularidade da captura de tempos (proposta: timestamps de entrada/saída de
    cada tela + evento de fim de áudio + posição do áudio ao avançar).

### Páginas sem texto-fonte
21. 🔴 Página "Informações gerais do estudo" — há texto voltado ao participante
    (Anexo 9), ou redigir rascunho a partir do TCLE para revisão?
22. 🔴 Página "Desconforto durante a pesquisa" — texto dedicado, ou reusar os
    parágrafos de desconforto do encerramento + contatos do TCLE?
23. Corpo do e-mail de convite (Brevo) — há texto do Anexo 9, ou redigir
    rascunho? (sem detalhar conteúdos dos esquemas — exigência do protocolo).

### Identidade
25. 🔴 Identidade visual: UnB, "Vivant Psicologia" (consultório), ou neutra do
    estudo com menção à UnB? (a marca em `docs/marca/` é da Vivant; o TCLE afirma
    que a participação não é psicoterapia).

### Storage
- Bucket `audios` está **público** (sem PII, cacheável). Trocar para privado +
  URL assinada se o CEP pedir.
