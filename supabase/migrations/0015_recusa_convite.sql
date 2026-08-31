-- =============================================================================
-- 0015 · Recusa de convite (extensão do E1)
--
-- O convidado que não deseja participar clica "Não tenho interesse" no e-mail e
-- registra a recusa sem login. Novo estado terminal do convite:
--   recusou — o convidado declarou não ter interesse; não recebe novos contatos.
--
-- O valor de enum é adicionado isolado: Postgres não permite usar um valor de
-- enum recém-criado na mesma transação em que ele foi adicionado (ver 0011).
-- =============================================================================

alter type public.invite_status add value if not exists 'recusou';

alter table public.invites
  add column if not exists recusado_em timestamptz;
