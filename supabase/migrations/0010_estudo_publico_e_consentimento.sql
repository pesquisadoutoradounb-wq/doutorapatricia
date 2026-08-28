-- =============================================================================
-- 0010 · View pública de estudos + opções de consentimento por estudo
-- =============================================================================

-- View mínima para o participante exibir o nome do estudo
create view public.estudos_publico with (security_invoker = false) as
  select id, slug, nome
  from public.studies
  where ativo;

revoke all on public.estudos_publico from anon;
grant select on public.estudos_publico to authenticated;

-- ---------------------------------------------------------------------------
-- Opções de decisão eletrônica do TCLE, por estudo.
-- O texto é do documento-fonte e NÃO pode ser alterado sem sinalização; o
-- administrador pode editá-lo no painel antes da coleta.
-- ---------------------------------------------------------------------------
create table public.consent_options (
  study_id  uuid not null references public.studies (id) on delete cascade,
  valor     text not null check (valor in ('aceitou', 'recusou')),
  ordem     smallint not null,
  texto     text not null,
  primary key (study_id, valor)
);
alter table public.consent_options enable row level security;

revoke all on public.consent_options from anon, authenticated;
grant select, insert, update, delete on public.consent_options to authenticated;

-- Admin gerencia; participante lê via view
create policy consent_options_select_admin on public.consent_options
  for select to authenticated using (public.is_admin());
create policy consent_options_write on public.consent_options
  for all to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

create view public.consent_options_publico with (security_invoker = false) as
  select study_id, valor, ordem, texto
  from public.consent_options
  order by ordem;
revoke all on public.consent_options_publico from anon;
grant select on public.consent_options_publico to authenticated;

-- Seed Estudo 1 (texto exato do TCLE-fonte)
insert into public.consent_options (study_id, valor, ordem, texto)
select s.id, x.valor, x.ordem, x.texto
from public.studies s
cross join (values
  ('aceitou', 1, 'Li e compreendi as informações apresentadas, tive oportunidade de esclarecer minhas dúvidas e concordo voluntariamente em participar do Estudo 1.'),
  ('recusou', 2, 'Não concordo em participar do Estudo 1.')
) as x(valor, ordem, texto)
where s.slug = 'estudo-1'
on conflict (study_id, valor) do nothing;
