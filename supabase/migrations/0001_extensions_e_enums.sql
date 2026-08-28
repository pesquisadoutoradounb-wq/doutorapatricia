-- =============================================================================
-- 0001 · Extensões e tipos enumerados
-- Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental (UnB)
-- =============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_stat_statements";

-- Papéis da equipe de pesquisa
create type public.admin_role as enum ('admin', 'colaborador', 'leitura');

-- Situação do convite (agregado, atualizado a partir de email_events + acessos)
create type public.invite_status as enum (
  'enviado', 'aberto', 'iniciado', 'concluido', 'expirado'
);

-- Modo de coleta. Determinado pelo convite e herdado pelo participante.
create type public.participant_mode as enum ('piloto', 'producao');

-- Etapa atual do participante (ordem obrigatória; permite retomar de onde parou)
create type public.participant_step as enum (
  'informacoes',
  'tcle',
  'sociodemografico',
  'ysq',
  'panas',
  'instrucoes',
  'vinhetas',
  'encerramento',
  'concluido'
);

-- Decisão registrada no TCLE
create type public.consent_decision as enum ('aceitou', 'recusou');

-- Tipo de evento de e-mail vindo do webhook do Brevo
create type public.email_event_type as enum (
  'enviado', 'entregue', 'aberto', 'clicado', 'bounce', 'spam', 'outro'
);
