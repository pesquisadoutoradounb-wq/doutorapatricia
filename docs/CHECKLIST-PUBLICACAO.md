# Checklist de publicação — Estudo 1

Ordem sugerida para colocar a plataforma no ar e começar a coletar. A
plataforma (A–E) está implementada; o que falta é conteúdo, credenciais e
conferência.

## 1. Banco de dados

- [x] Aplicar todas as migrations: `supabase db push`. `0001`–`0015` aplicadas
      em produção (2026-08-31). `0011`–`0014` já tinham partes aplicadas à mão
      antes — os guards `if not exists` cobriram; `schema_migrations` agora
      registra tudo.
- [ ] Confirmar que o bucket de Storage `audios` existe e está público.

## 2. Conteúdo dos instrumentos (só no banco — repo é público)

Gerar `supabase/seed.local.sql` a partir dos arquivos-fonte:

```
python scripts/gerar-seed-local.py
psql "<DB_URL>" -f supabase/seed.local.sql
```

- [ ] **YSQ-S3** — conferir os 90 enunciados de
      `docs/fonte-metodologia/_transcricao-para-conferencia.md` contra o
      instrumento oficial. Corrigir no seed / no painel se necessário.
- [ ] **PANAS** — conferir os 19 termos e a instrução reescrita
      ("...como você realmente se sente neste momento").
- [ ] **Vinhetas** — conferir os 10 textos-estímulo.
- [ ] **Áudios** — gravar os 10 áudios e subir em **Painel → Áudios**
      (MP3 mono, ~128 kbps, curto). O fluxo funciona sem eles ("áudio ainda
      não disponível"), mas a coleta real precisa deles.

## 3. Textos editáveis (Painel → Documentos)

- [ ] **TCLE** — preencher os `[COLCHETES]` (orientador, contatos, CEP,
      armazenamento, ressarcimento). Ajustar a `versão` ao alterar.
- [ ] **Informações gerais do estudo** — redigir (não há texto-fonte;
      PERGUNTAR 21).
- [ ] **Página "Desconforto durante a pesquisa"** — redigir (PERGUNTAR 22).
- [ ] **Instruções para a tarefa de imaginação** — revisar o rascunho-fonte.
- [ ] **Mensagem de encerramento** — revisar o rascunho-fonte.
- [ ] **Mensagem de inelegibilidade** — revisar (texto da pesquisadora já
      carregado).
- [ ] **E-mail de convite** — corpo em `supabase/templates/convite-email.html`
      (versionado; editável também no painel). Manter `{{nome}}`, `{{link}}` e
      `{{link_recusa}}`; preencher `[X]` (duração) e `[CONTATO/CEP]`; o título do
      documento vira o assunto. **Publicar este corpo HTML** (o
      `gerar-seed-local.py` já o carrega): sem ele, um `{{link}}` sozinho deixa
      de virar hyperlink (mudança de contrato do `renderCorpoConvite`).
- [ ] **Instruções do YSQ / PANAS** — revisar (rascunhos genéricos).

## 4. Equipe

- [ ] Criar o(s) usuário(s) da equipe no painel do Supabase (Auth).
- [ ] Inserir a linha correspondente em `research_admins` com o papel
      (`admin` / `colaborador` / `leitura`). Sem essa linha o login desloga.

## 5. E-mail (Brevo)

- [x] `supabase functions deploy` — 5 functions ativas em produção
      (2026-08-31), incluindo `recusar-convite` (sem JWT via `config.toml`).
- [ ] Criar conta no Brevo, verificar um remetente (domínio ou e-mail).
- [ ] **`supabase secrets set`** para: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`,
      `BREVO_SENDER_NAME`, `APP_BASE_URL`, `BREVO_WEBHOOK_SECRET`.
      **Hoje NENHUM está definido** — `send-invite` responde `501` e não cria
      convites até isso ser feito. (`recusar-convite` não depende do Brevo.)
- [ ] No Brevo, cadastrar o webhook de eventos transacionais apontando para
      `<SUPABASE_URL>/functions/v1/brevo-webhook?s=<BREVO_WEBHOOK_SECRET>`
      (eventos: delivered, opened, click, hard_bounce, soft_bounce, spam).
- [ ] Enviar um convite de teste para uma conta própria: conferir o layout do
      e-mail no Gmail e no Outlook, o botão, o link de participação e o link
      "Não tenho interesse" (deve levar a `/#/recusar/<token>` e marcar o
      convite como **Recusou** no painel).

## 6. Front-end

- [ ] GitHub Actions Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
      `VITE_APP_BASE_URL`, `VITE_APP_BASE_PATH`.
- [ ] `git push` na `main` → deploy automático no GitHub Pages.

## 7. Teste de ponta a ponta (antes de convidar gente de verdade)

- [ ] Painel → Convites → **"Gerar link de teste"**. Abrir o link.
- [ ] Percorrer todo o fluxo: informações → TCLE → sociodemográfico → YSQ →
      PANAS → instruções → 10 vinhetas (estímulo + áudio + avaliação) →
      encerramento.
- [ ] Testar a inelegibilidade (idade < 18 ou "Não" na seção C).
- [ ] Testar o modal de abandono (deixar 2+ respostas em branco e continuar).
- [ ] Fechar o navegador no meio e reabrir o link — deve retomar de onde parou.
- [ ] Conferir no Painel → Participantes que a participação piloto apareceu;
      **descartá-la** ou deixá-la fora (o padrão já esconde pilotos).
- [ ] Painel → Resultados e Painel → Exportar: baixar os CSVs e conferir.

## 8. Decisões ainda abertas (não bloqueiam o teste)

- **Identidade visual** (PERGUNTAR 25): UnB / Vivant / neutra. Hoje: neutra com
  menção à UnB (`src/lib/config.ts` → `config.identidade`).
- **Sociodemográfico no repositório**: o texto está no bundle público
  (`src/lib/instrumentos/sociodemografico.ts`). Confirmar com o CEP; se não
  aceitarem, mover para tabela + editor.
- **Pontuação**: pontos de corte do YSQ e faixas do PANAS — aguardando o áudio
  da pesquisadora. Os totais e médias já são calculados e exportados.
- **PERGUNTAR 20 (tempos)**: implementado; confirmar o texto explicativo com a
  pesquisadora (ver spec de D).
- **"Não sei" na Q17 do sociodemográfico**: hoje **não** torna inelegível.
