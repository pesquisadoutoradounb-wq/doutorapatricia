-- =============================================================================
-- 0011 · Estados terminais do participante + resultado de elegibilidade
--
-- Sub-projeto C. Dois desfechos fora da sequência feliz:
--   inelegivel   — reprovado nos critérios do sociodemográfico (idade / seção C)
--   interrompido — pediu para cancelar a participação no modal de abandono
--
-- Os valores de enum são adicionados aqui, isolados: Postgres não permite usar
-- um valor de enum recém-criado na mesma transação em que ele foi adicionado.
-- A lógica do trigger que aceita as transições vem em 0012.
-- =============================================================================

alter type public.participant_step add value if not exists 'inelegivel';
alter type public.participant_step add value if not exists 'interrompido';

-- ---------------------------------------------------------------------------
-- Resultado da avaliação de elegibilidade (preenchido ao concluir o
-- sociodemográfico). NULL = ainda não avaliado.
-- ---------------------------------------------------------------------------
alter table public.sociodemographic_responses
  add column if not exists elegivel boolean,
  add column if not exists inelegibilidade_motivos text[];
