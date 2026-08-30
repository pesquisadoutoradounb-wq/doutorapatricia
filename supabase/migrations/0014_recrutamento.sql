-- =============================================================================
-- 0014 · Recrutamento & operação (sub-projeto E1)
--
--  - participants.descartado: tira participantes de teste/erro da análise sem
--    apagar dados.
--  - definir_descarte(): admin marca/desmarca (não alargamos os grants de
--    coluna de participants, hoje restritos a etapa_atual).
--  - criar_convite_piloto(): gera um convite piloto sem enviar e-mail.
-- =============================================================================

alter table public.participants
  add column if not exists descartado      boolean not null default false,
  add column if not exists descartado_em   timestamptz,
  add column if not exists descartado_por  uuid references auth.users (id) on delete set null,
  add column if not exists descartado_nota text;

create index if not exists participants_descartado_idx
  on public.participants (study_id) where not descartado;

-- ---------------------------------------------------------------------------
-- Marcar / desmarcar descarte de um participante
-- ---------------------------------------------------------------------------
create or replace function public.definir_descarte(
  p_participant uuid,
  p_descartado  boolean,
  p_nota        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_pode_escrever() then
    raise exception 'sem permissão de escrita';
  end if;

  update public.participants
    set descartado      = p_descartado,
        descartado_em   = case when p_descartado then now() else null end,
        descartado_por  = case when p_descartado then auth.uid() else null end,
        descartado_nota = case when p_descartado then p_nota else null end
    where id = p_participant;
end;
$$;

revoke all on function public.definir_descarte(uuid, boolean, text) from public, anon;
grant execute on function public.definir_descarte(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Criar um convite piloto (link de teste) — sem envio de e-mail
-- ---------------------------------------------------------------------------
create or replace function public.criar_convite_piloto(p_study uuid)
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  nova public.invites;
  n int;
begin
  if not public.admin_pode_escrever() then
    raise exception 'sem permissão de escrita';
  end if;

  select count(*) + 1 into n
  from public.invites
  where study_id = p_study and modo = 'piloto';

  insert into public.invites (study_id, email, nome, modo, status, criado_por)
  values (
    p_study,
    'piloto+' || n || '@teste.local',
    'Link de teste ' || n,
    'piloto',
    'enviado',
    auth.uid()
  )
  returning * into nova;

  return nova;
end;
$$;

revoke all on function public.criar_convite_piloto(uuid) from public, anon;
grant execute on function public.criar_convite_piloto(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- O corpo do e-mail de convite é conteúdo de operação (equipe), não do
-- participante: fica de fora da view pública de documentos.
-- ---------------------------------------------------------------------------
drop view public.documentos_estudo_publico;
create view public.documentos_estudo_publico with (security_invoker = false) as
  select study_id, slug, versao, titulo, corpo_html
  from public.study_documents
  where ativo and slug <> 'convite_email';
revoke all on public.documentos_estudo_publico from anon;
grant select on public.documentos_estudo_publico to authenticated;
