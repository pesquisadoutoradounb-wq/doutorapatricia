-- =============================================================================
-- 0006 · Triggers de integridade
-- =============================================================================

-- ---------------------------------------------------------------------------
-- consent_records é append-only. Bloqueia UPDATE/DELETE mesmo para o dono da
-- tabela e para o service_role — o snapshot do TCLE não pode mudar depois.
-- ---------------------------------------------------------------------------
create or replace function public.bloquear_alteracao_consentimento()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consent_records é imutável: % não permitido', tg_op;
end;
$$;

create trigger consent_records_imutavel
  before update or delete on public.consent_records
  for each row execute function public.bloquear_alteracao_consentimento();

-- ---------------------------------------------------------------------------
-- etapa_atual do participante só avança (ou permanece). Impede que um
-- participante pule instrumentos manipulando o valor.
-- Admins/service_role (is_admin() ou sem participante no contexto) ficam livres
-- para correções operacionais.
-- ---------------------------------------------------------------------------
create or replace function public.validar_avanco_etapa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ordem constant public.participant_step[] := array[
    'informacoes','tcle','sociodemografico','ysq','panas',
    'instrucoes','vinhetas','encerramento','concluido'
  ]::public.participant_step[];
  pos_antiga int;
  pos_nova int;
begin
  if new.etapa_atual = old.etapa_atual then
    return new;
  end if;

  -- correção manual por admin é permitida
  if public.is_admin() then
    return new;
  end if;

  select array_position(ordem, old.etapa_atual) into pos_antiga;
  select array_position(ordem, new.etapa_atual) into pos_nova;

  if pos_nova < pos_antiga then
    raise exception 'etapa_atual não pode retroceder (% -> %)', old.etapa_atual, new.etapa_atual;
  end if;

  if pos_nova > pos_antiga + 1 then
    raise exception 'etapa_atual não pode pular etapas (% -> %)', old.etapa_atual, new.etapa_atual;
  end if;

  return new;
end;
$$;

create trigger participants_etapa_monotonica
  before update of etapa_atual on public.participants
  for each row execute function public.validar_avanco_etapa();

-- ---------------------------------------------------------------------------
-- Touch de colunas "atualizado_em"
-- ---------------------------------------------------------------------------
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger socio_touch
  before update on public.sociodemographic_responses
  for each row execute function public.touch_atualizado_em();

create trigger vresp_touch
  before update on public.vignette_responses
  for each row execute function public.touch_atualizado_em();

create trigger vignettes_touch
  before update on public.vignettes
  for each row execute function public.touch_atualizado_em();

create trigger audio_assets_touch
  before update on public.audio_assets
  for each row execute function public.touch_atualizado_em();
