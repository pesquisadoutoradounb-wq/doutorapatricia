-- =============================================================================
-- 0013 · Tarefa experimental de imaginação (sub-projeto D)
--
--  - q12_matriz: a Q12 da avaliação virou matriz (7 tendências + "Outra").
--  - gerar_ordem_vinhetas(): sorteia UMA vez a ordem das 10 vinhetas do
--    participante (o participante não tem INSERT em vignette_order).
--  - concluir_participacao(): transição final (o participante não tem UPDATE
--    de participants.concluido_em nem de invites).
-- =============================================================================

alter table public.vignette_responses
  add column if not exists q12_matriz jsonb;

comment on column public.vignette_responses.q12_matriz is
  'Tendência comportamental (Q12b): { atender, expressar, evitar, silencio, '
  'explicar, afastar, criticar_se: 0..10, outra: { rotulo, valor } }. '
  'q12_tendencia_aberta = texto livre 12a. q12_forca_vontade: sem uso nesta versão.';

-- ---------------------------------------------------------------------------
-- Ordem randomizada das vinhetas — idempotente por participante
-- ---------------------------------------------------------------------------
create or replace function public.gerar_ordem_vinhetas()
returns setof public.vignette_order
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := public.current_participant_id();
  sid uuid;
begin
  if pid is null then
    raise exception 'sem participante no contexto';
  end if;

  if not exists (select 1 from public.vignette_order where participant_id = pid) then
    select study_id into sid from public.participants where id = pid;

    insert into public.vignette_order (participant_id, vignette_id, posicao)
    select pid, v.id, row_number() over (order by random())
    from public.vignettes v
    where v.study_id = sid;
  end if;

  return query
    select * from public.vignette_order
    where participant_id = pid
    order by posicao;
end;
$$;

revoke all on function public.gerar_ordem_vinhetas() from public, anon;
grant execute on function public.gerar_ordem_vinhetas() to authenticated;

-- ---------------------------------------------------------------------------
-- Conclusão da participação — transição final
-- ---------------------------------------------------------------------------
create or replace function public.concluir_participacao()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := public.current_participant_id();
  inv uuid;
  etapa public.participant_step;
begin
  if pid is null then
    raise exception 'sem participante no contexto';
  end if;

  select etapa_atual, invite_id into etapa, inv
  from public.participants where id = pid;

  if etapa = 'concluido' then
    return; -- idempotente
  end if;
  if etapa <> 'encerramento' then
    raise exception 'concluir_participacao só a partir de encerramento (atual: %)', etapa;
  end if;

  update public.participants
    set etapa_atual = 'concluido', concluido_em = now()
    where id = pid;

  update public.invites
    set status = 'concluido', respondido_em = coalesce(respondido_em, now())
    where id = inv;
end;
$$;

revoke all on function public.concluir_participacao() from public, anon;
grant execute on function public.concluir_participacao() to authenticated;
