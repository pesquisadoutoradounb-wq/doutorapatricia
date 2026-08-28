-- =============================================================================
-- 0002 · Tabelas
--
-- Separação de públicos (bases e sensibilidades diferentes):
--   research_admins ................ equipe de pesquisa (liga a auth.users)
--   invites ........................ convites (contém e-mail/nome — identificável)
--   participants ................... pseudônimo interno; ponte invite <-> dados
--   *_responses / consent_records .. dados de pesquisa, por participant_id
--
-- Toda tabela tem RLS habilitado aqui; as políticas ficam em 0004.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Equipe de pesquisa
-- ---------------------------------------------------------------------------
create table public.research_admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  nome        text,
  papel       public.admin_role not null default 'leitura',
  criado_em   timestamptz not null default now()
);
alter table public.research_admins enable row level security;

-- ---------------------------------------------------------------------------
-- Convites (identificável — nunca exposto no fluxo do participante)
-- ---------------------------------------------------------------------------
create table public.invites (
  id                        uuid primary key default gen_random_uuid(),
  email                     text not null,
  nome                      text,
  token                     uuid not null unique default gen_random_uuid(),
  status                    public.invite_status not null default 'enviado',
  modo                      public.participant_mode not null default 'producao',
  enviado_em                timestamptz,
  respondido_em             timestamptz,
  expira_em                 timestamptz,
  primeiro_acesso_em        timestamptz,
  ultimo_acesso_ip          inet,
  ultimo_acesso_user_agent  text,
  criado_por                uuid references auth.users (id) on delete set null,
  criado_em                 timestamptz not null default now()
);
create index invites_status_idx on public.invites (status);
create index invites_modo_idx on public.invites (modo);
alter table public.invites enable row level security;

-- ---------------------------------------------------------------------------
-- Participantes (pseudônimo interno)
-- ---------------------------------------------------------------------------
create table public.participants (
  id            uuid primary key default gen_random_uuid(),
  invite_id     uuid not null unique references public.invites (id) on delete restrict,
  modo          public.participant_mode not null,
  etapa_atual   public.participant_step not null default 'informacoes',
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  criado_em     timestamptz not null default now(),
  concluido_em  timestamptz
);
create index participants_auth_user_idx on public.participants (auth_user_id);
alter table public.participants enable row level security;

-- ---------------------------------------------------------------------------
-- Documentos do estudo (textos versionados — TCLE, informações, instruções,
-- encerramento, desconforto). Vivem só no banco, nunca no bundle público.
-- ---------------------------------------------------------------------------
create table public.study_documents (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,
  versao       text not null,
  titulo       text not null,
  corpo_html   text not null,
  ativo        boolean not null default false,
  criado_por   uuid references auth.users (id) on delete set null,
  criado_em    timestamptz not null default now(),
  unique (slug, versao)
);
-- Apenas uma versão ativa por slug.
create unique index study_documents_um_ativo_por_slug
  on public.study_documents (slug) where ativo;
alter table public.study_documents enable row level security;

-- ---------------------------------------------------------------------------
-- Registro de consentimento (append-only; snapshot imutável do texto)
-- ---------------------------------------------------------------------------
create table public.consent_records (
  id                   uuid primary key default gen_random_uuid(),
  participant_id       uuid not null references public.participants (id) on delete restrict,
  tcle_versao          text not null,
  tcle_texto_snapshot  text not null,
  decisao              public.consent_decision not null,
  registrado_em        timestamptz not null default now(),
  ip                   inet,
  user_agent           text
);
create index consent_records_participant_idx on public.consent_records (participant_id);
alter table public.consent_records enable row level security;

-- ---------------------------------------------------------------------------
-- Questionário Sociodemográfico e Clínico (uma linha por participante)
--
-- "Prefiro não responder" é gravado como string explícita ('prefiro_nao_responder'),
-- nunca como NULL. NULL = item ainda não respondido.
--
-- ATENÇÃO: os nomes/tipos abaixo dependem das PERGUNTAR 4, 6, 7. Estrutura
-- provisória; ajustável por migration futura sem afetar as demais tabelas.
-- ---------------------------------------------------------------------------
create table public.sociodemographic_responses (
  participant_id            uuid primary key references public.participants (id) on delete restrict,

  q1_idade                  smallint,                       -- PERGUNTAR 6: obrigatório? sem PNR na fonte
  q2_sexo_registrado        text,
  q3_identidade_genero      text,
  q3_identidade_genero_outra text,
  q4_cor_raca               text,
  q5_estado_conjugal        text,
  q5_estado_conjugal_outro  text,
  q6_escolaridade           text,
  q7_ocupacao               text,
  q7_ocupacao_outra         text,
  q8_uf                     text,                           -- PERGUNTAR 4: lista de UFs vs texto livre
  q8_pais                   text,                           -- condicional: "Resido fora do Brasil"
  q9_renda_familiar         text,

  q10_psicoterapia_atual    text,
  q10_tempo                 text,                           -- condicional: q10 = 'sim'
  q11_psicoterapia_anterior text,
  q12_psiquiatra_atual      text,
  q13_medicacao_atual       text,
  q13_medicacao_quais       text,                           -- condicional: q13 = 'sim'
  q14_diagnostico_informado text,
  q14_diagnosticos          text[],                         -- condicional: q14 = 'sim' (multi)
  q14_diagnostico_outro     text,

  q15_acesso_internet       text,
  q16_dispositivos          text[],
  q16_dispositivo_outro     text,
  q17_dispositivo_audio     text,
  q18_compreende_portugues  text,

  atualizado_em             timestamptz not null default now(),
  completado_em             timestamptz
);
alter table public.sociodemographic_responses enable row level security;

-- ---------------------------------------------------------------------------
-- YSQ-S3 — 90 itens, escala 1–6. Normalizado (facilita save parcial/retomada).
-- ---------------------------------------------------------------------------
create table public.ysq_item_responses (
  participant_id  uuid not null references public.participants (id) on delete restrict,
  item            smallint not null check (item between 1 and 90),
  valor           smallint not null check (valor between 1 and 6),
  respondido_em   timestamptz not null default now(),
  primary key (participant_id, item)
);
alter table public.ysq_item_responses enable row level security;

create table public.ysq_completions (
  participant_id  uuid primary key references public.participants (id) on delete restrict,
  completado_em   timestamptz not null default now()
);
alter table public.ysq_completions enable row level security;

-- ---------------------------------------------------------------------------
-- PANAS — 19 itens, escala 1–5.
-- ---------------------------------------------------------------------------
create table public.panas_item_responses (
  participant_id  uuid not null references public.participants (id) on delete restrict,
  item            smallint not null check (item between 1 and 19),
  valor           smallint not null check (valor between 1 and 5),
  respondido_em   timestamptz not null default now(),
  primary key (participant_id, item)
);
alter table public.panas_item_responses enable row level security;

create table public.panas_completions (
  participant_id  uuid primary key references public.participants (id) on delete restrict,
  completado_em   timestamptz not null default now()
);
alter table public.panas_completions enable row level security;

-- ---------------------------------------------------------------------------
-- Vinhetas (referência / seed). titulo_interno, dominio e conteudo_predominante
-- NUNCA são expostos ao participante (só via view segura em 0005).
-- ---------------------------------------------------------------------------
create table public.vignettes (
  id                     smallint primary key check (id between 1 and 10),
  dominio                smallint not null check (dominio in (1, 2)),
  titulo_interno         text not null,
  conteudo_predominante  text,
  texto_estimulo         text not null,
  atualizado_em          timestamptz not null default now()
);
alter table public.vignettes enable row level security;

-- Áudios de imaginação guiada (bucket de Storage). PERGUNTAR 13: 1 áudio ou 10.
create table public.audio_assets (
  vignette_id        smallint primary key references public.vignettes (id) on delete cascade,
  storage_path       text not null,
  duracao_segundos   numeric(6, 2),
  atualizado_em      timestamptz not null default now()
);
alter table public.audio_assets enable row level security;

-- ---------------------------------------------------------------------------
-- Ordem de apresentação das vinhetas por participante.
-- Gerada UMA vez pela Edge Function no início do bloco; nunca re-randomizada.
-- ---------------------------------------------------------------------------
create table public.vignette_order (
  participant_id  uuid not null references public.participants (id) on delete restrict,
  vignette_id     smallint not null references public.vignettes (id) on delete restrict,
  posicao         smallint not null check (posicao between 1 and 10),
  gerado_em       timestamptz not null default now(),
  primary key (participant_id, vignette_id),
  unique (participant_id, posicao)
);
alter table public.vignette_order enable row level security;

-- ---------------------------------------------------------------------------
-- Avaliação imediata após a imaginação guiada (uma linha por vinheta).
--
-- ATENÇÃO: campos condicionais e a inclusão de q3_matriz dependem das
-- PERGUNTAR 16 e 17. Estrutura provisória.
-- ---------------------------------------------------------------------------
create table public.vignette_responses (
  id                        uuid primary key default gen_random_uuid(),
  participant_id            uuid not null references public.participants (id) on delete restrict,
  vignette_id               smallint not null references public.vignettes (id) on delete restrict,

  q1_imersao                smallint check (q1_imersao between 0 and 10),
  q2_emocao_aberta          text,
  q2_emocao_categoria       text,
  q2_emocao_outra           text,
  q3_intensidade            smallint check (q3_intensidade between 0 and 10),
  q3_matriz                 jsonb,                       -- PERGUNTAR 17: entra no piloto?
  q4_valencia_emocional     smallint check (q4_valencia_emocional between -5 and 5),
  q5_desconforto            smallint check (q5_desconforto between 0 and 10),
  q6_pensamento_automatico  text,
  q7_imagem_espontanea      text check (q7_imagem_espontanea in ('sim', 'nao', 'nao_tenho_certeza')),
  q8_vividez                smallint check (q8_vividez between 0 and 10),
  q9_perspectiva            text,
  q9_perspectiva_outra      text,
  q10_valencia_imagem       smallint check (q10_valencia_imagem between -5 and 5),
  q11_conteudo_imagem       text,
  q12_tendencia_aberta      text,
  q12_forca_vontade         smallint check (q12_forca_vontade between 0 and 10),

  -- Tempos (ver PERGUNTAR 20)
  vinheta_exibida_em            timestamptz,
  vinheta_continuar_em          timestamptz,
  audio_iniciado_em             timestamptz,
  audio_terminado_em            timestamptz,
  audio_duracao_ouvida_seg      numeric(7, 2),
  audio_completou               boolean,
  avaliacao_iniciada_em         timestamptz,
  avaliacao_enviada_em          timestamptz,

  atualizado_em             timestamptz not null default now(),
  completado_em             timestamptz,

  unique (participant_id, vignette_id)
);
create index vignette_responses_participant_idx on public.vignette_responses (participant_id);
alter table public.vignette_responses enable row level security;

-- ---------------------------------------------------------------------------
-- Eventos de e-mail (webhook do Brevo). payload bruto para depuração.
-- ---------------------------------------------------------------------------
create table public.email_events (
  id           uuid primary key default gen_random_uuid(),
  invite_id    uuid references public.invites (id) on delete set null,
  tipo         public.email_event_type not null,
  ocorrido_em  timestamptz not null default now(),
  payload      jsonb
);
create index email_events_invite_idx on public.email_events (invite_id);
alter table public.email_events enable row level security;
