-- =============================================================================
-- 0009 · Multi-estudo
--
-- A plataforma passa a hospedar vários estudos. A equipe é uma só (papel
-- global em research_admins); um seletor de estudo troca o contexto do painel.
-- Convites, participantes, documentos e vinhetas são escopados por estudo.
-- Instrumentos canônicos (YSQ, PANAS) permanecem globais; `study_instruments`
-- diz quais instrumentos cada estudo usa e em que ordem.
--
-- Participantes continuam single-study por token. A regra "só vai ao Estudo 2
-- depois de concluir o Estudo 1" fica para o design do Estudo 2.
-- =============================================================================

create table public.studies (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  nome        text not null,
  descricao   text,
  ativo       boolean not null default true,
  ordem       smallint not null default 0,
  criado_em   timestamptz not null default now()
);
alter table public.studies enable row level security;

insert into public.studies (slug, nome, ordem) values
  ('estudo-1', 'Estudo 1 — Ativação Experimental de Esquemas e Imagética Mental', 1);

-- ---------------------------------------------------------------------------
-- study_id nas tabelas escopadas (nullable → backfill → not null)
-- ---------------------------------------------------------------------------
alter table public.invites          add column study_id uuid references public.studies (id) on delete restrict;
alter table public.participants     add column study_id uuid references public.studies (id) on delete restrict;
alter table public.study_documents  add column study_id uuid references public.studies (id) on delete restrict;
alter table public.vignettes        add column study_id uuid references public.studies (id) on delete restrict;

update public.invites         set study_id = (select id from public.studies where slug = 'estudo-1') where study_id is null;
update public.participants     set study_id = (select id from public.studies where slug = 'estudo-1') where study_id is null;
update public.study_documents  set study_id = (select id from public.studies where slug = 'estudo-1') where study_id is null;
update public.vignettes        set study_id = (select id from public.studies where slug = 'estudo-1') where study_id is null;

alter table public.invites         alter column study_id set not null;
alter table public.participants     alter column study_id set not null;
alter table public.study_documents  alter column study_id set not null;
alter table public.vignettes        alter column study_id set not null;

create index invites_study_idx on public.invites (study_id);
create index participants_study_idx on public.participants (study_id);

-- ---------------------------------------------------------------------------
-- study_documents: unicidade e "um ativo" passam a ser por estudo
-- ---------------------------------------------------------------------------
alter table public.study_documents drop constraint study_documents_slug_versao_key;
alter table public.study_documents
  add constraint study_documents_estudo_slug_versao_key unique (study_id, slug, versao);

drop index study_documents_um_ativo_por_slug;
create unique index study_documents_um_ativo_por_slug
  on public.study_documents (study_id, slug) where ativo;

-- ---------------------------------------------------------------------------
-- Quais instrumentos cada estudo usa (ordem de aplicação)
-- ---------------------------------------------------------------------------
create table public.study_instruments (
  study_id     uuid not null references public.studies (id) on delete cascade,
  instrumento  text not null check (instrumento in ('sociodemografico', 'ysq', 'panas')),
  ordem        smallint not null,
  primary key (study_id, instrumento)
);
alter table public.study_instruments enable row level security;

insert into public.study_instruments (study_id, instrumento, ordem)
select s.id, x.instrumento, x.ordem
from public.studies s
cross join (values ('sociodemografico', 1), ('ysq', 2), ('panas', 3)) as x(instrumento, ordem)
where s.slug = 'estudo-1';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
revoke all on public.studies from anon, authenticated;
revoke all on public.study_instruments from anon, authenticated;
grant select, insert, update, delete on public.studies to authenticated;
grant select, insert, update, delete on public.study_instruments to authenticated;

-- studies: qualquer admin lê; só 'admin' gerencia
create policy studies_select on public.studies
  for select to authenticated using (public.is_admin());
create policy studies_insert on public.studies
  for insert to authenticated with check (public.admin_role() = 'admin');
create policy studies_update on public.studies
  for update to authenticated
  using (public.admin_role() = 'admin') with check (public.admin_role() = 'admin');
create policy studies_delete on public.studies
  for delete to authenticated using (public.admin_role() = 'admin');

create policy study_instr_select on public.study_instruments
  for select to authenticated using (public.is_admin());
create policy study_instr_write on public.study_instruments
  for all to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

-- ---------------------------------------------------------------------------
-- Views de participante ganham study_id (o app filtra pelo estudo da sessão)
-- ---------------------------------------------------------------------------
drop view public.documentos_estudo_publico;
create view public.documentos_estudo_publico with (security_invoker = false) as
  select study_id, slug, versao, titulo, corpo_html
  from public.study_documents
  where ativo;
revoke all on public.documentos_estudo_publico from anon;
grant select on public.documentos_estudo_publico to authenticated;

drop view public.vinhetas_participante;
create view public.vinhetas_participante with (security_invoker = false) as
  select study_id, id, texto_estimulo
  from public.vignettes;
revoke all on public.vinhetas_participante from anon;
grant select on public.vinhetas_participante to authenticated;
