-- =============================================================================
-- 0012 · Transições permitidas para os estados terminais
--
-- Reescreve `validar_avanco_etapa` (0006) para além da regra monotônica aceitar:
--   sociodemografico -> inelegivel        (reprovado na avaliação de elegibilidade)
--   qualquer não-terminal -> interrompido (desistência pelo modal de abandono)
--
-- De `inelegivel` / `interrompido` não se sai (exceto correção manual por admin).
-- O gatilho continua sendo `participants_etapa_monotonica` (0006); só a função
-- muda.
-- =============================================================================

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
  terminais constant public.participant_step[] :=
    array['inelegivel','interrompido']::public.participant_step[];
  pos_antiga int;
  pos_nova int;
begin
  if new.etapa_atual = old.etapa_atual then
    return new;
  end if;

  -- correção manual por admin é sempre permitida
  if public.is_admin() then
    return new;
  end if;

  -- de um estado terminal não se sai
  if old.etapa_atual = any (terminais) then
    raise exception 'participação encerrada (%): etapa_atual não pode mudar', old.etapa_atual;
  end if;

  -- desistência: de qualquer etapa não-terminal para 'interrompido'
  if new.etapa_atual = 'interrompido' then
    return new;
  end if;

  -- inelegibilidade: somente a partir do sociodemográfico
  if new.etapa_atual = 'inelegivel' then
    if old.etapa_atual = 'sociodemografico' then
      return new;
    end if;
    raise exception
      'inelegibilidade só pode ser marcada a partir do sociodemográfico (origem: %)',
      old.etapa_atual;
  end if;

  -- sequência feliz: só avança uma etapa por vez, nunca retrocede
  select array_position(ordem, old.etapa_atual) into pos_antiga;
  select array_position(ordem, new.etapa_atual) into pos_nova;

  if pos_nova is null then
    raise exception 'etapa_atual inválida na sequência: %', new.etapa_atual;
  end if;

  if pos_nova < pos_antiga then
    raise exception 'etapa_atual não pode retroceder (% -> %)', old.etapa_atual, new.etapa_atual;
  end if;

  if pos_nova > pos_antiga + 1 then
    raise exception 'etapa_atual não pode pular etapas (% -> %)', old.etapa_atual, new.etapa_atual;
  end if;

  return new;
end;
$$;
