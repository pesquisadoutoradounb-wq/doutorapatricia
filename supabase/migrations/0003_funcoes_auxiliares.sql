-- =============================================================================
-- 0003 · Funções auxiliares para RLS
-- =============================================================================

-- ID do participante a partir do claim gravado em app_metadata pelo
-- `vincular-sessao`. Retorna NULL para admins e sessões sem claim.
create or replace function public.current_participant_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(auth.jwt() -> 'app_metadata' ->> 'participant_id', ''),
    ''
  )::uuid
$$;

-- Verdadeiro se o usuário autenticado está em research_admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.research_admins ra
    where ra.user_id = auth.uid()
  )
$$;

-- Papel do admin autenticado (NULL se não for admin).
create or replace function public.admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select ra.papel from public.research_admins ra
  where ra.user_id = auth.uid()
$$;

-- Admin com permissão de escrita (admin ou colaborador; 'leitura' não escreve).
create or replace function public.admin_pode_escrever()
returns boolean
language sql
stable
as $$
  select public.admin_role() in ('admin', 'colaborador')
$$;

revoke all on function public.current_participant_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.admin_role() from public;
revoke all on function public.admin_pode_escrever() from public;
grant execute on function public.current_participant_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_role() to authenticated;
grant execute on function public.admin_pode_escrever() to authenticated;
