-- =============================================================================
-- 0008 · Tabelas de referência com o TEXTO dos itens dos instrumentos
--
-- Os enunciados do YSQ-S3 e as palavras do PANAS são conteúdo de instrumento
-- (pré-CEP): vivem só no banco e são servidos ao participante por view, nunca
-- pelo bundle. Mesmo padrão de `vignettes`.
--
-- Conteúdo real entra por `supabase/seed.local.sql` (gitignore) ou pelo painel
-- (sub-projeto E). O seed versionado tem apenas placeholders.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- YSQ-S3 — 90 enunciados
-- ---------------------------------------------------------------------------
create table public.ysq_items (
  item          smallint primary key check (item between 1 and 90),
  enunciado     text not null,
  atualizado_em timestamptz not null default now()
);
alter table public.ysq_items enable row level security;

-- ---------------------------------------------------------------------------
-- PANAS — 19 termos
-- ---------------------------------------------------------------------------
create table public.panas_items (
  item          smallint primary key check (item between 1 and 19),
  termo         text not null,
  atualizado_em timestamptz not null default now()
);
alter table public.panas_items enable row level security;

-- ---------------------------------------------------------------------------
-- Rótulos de escala (YSQ 1–6, PANAS 1–5). As escalas da avaliação
-- pós-imaginação (0–10, −5..+5, categóricas) entram no sub-projeto D.
-- ---------------------------------------------------------------------------
create table public.instrument_scale_points (
  instrumento   text not null check (instrumento in ('ysq', 'panas')),
  valor         smallint not null,
  rotulo        text not null,
  atualizado_em timestamptz not null default now(),
  primary key (instrumento, valor)
);
alter table public.instrument_scale_points enable row level security;

-- ---------------------------------------------------------------------------
-- Grants + RLS (mesmo padrão de 0004: base só admin; participante lê via view)
-- ---------------------------------------------------------------------------
revoke all on public.ysq_items from anon, authenticated;
revoke all on public.panas_items from anon, authenticated;
revoke all on public.instrument_scale_points from anon, authenticated;

grant select, insert, update, delete on public.ysq_items to authenticated;
grant select, insert, update, delete on public.panas_items to authenticated;
grant select, insert, update, delete on public.instrument_scale_points to authenticated;

create policy ysq_items_select on public.ysq_items
  for select to authenticated using (public.is_admin());
create policy ysq_items_write on public.ysq_items
  for all to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

create policy panas_items_select on public.panas_items
  for select to authenticated using (public.is_admin());
create policy panas_items_write on public.panas_items
  for all to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

create policy scale_points_select on public.instrument_scale_points
  for select to authenticated using (public.is_admin());
create policy scale_points_write on public.instrument_scale_points
  for all to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

create trigger ysq_items_touch
  before update on public.ysq_items
  for each row execute function public.touch_atualizado_em();
create trigger panas_items_touch
  before update on public.panas_items
  for each row execute function public.touch_atualizado_em();
create trigger scale_points_touch
  before update on public.instrument_scale_points
  for each row execute function public.touch_atualizado_em();

-- ---------------------------------------------------------------------------
-- Views para o participante
-- ---------------------------------------------------------------------------
create view public.ysq_itens_participante with (security_invoker = false) as
  select item, enunciado from public.ysq_items order by item;
revoke all on public.ysq_itens_participante from anon;
grant select on public.ysq_itens_participante to authenticated;

create view public.panas_itens_participante with (security_invoker = false) as
  select item, termo from public.panas_items order by item;
revoke all on public.panas_itens_participante from anon;
grant select on public.panas_itens_participante to authenticated;

create view public.escalas_instrumento_participante with (security_invoker = false) as
  select instrumento, valor, rotulo from public.instrument_scale_points order by instrumento, valor;
revoke all on public.escalas_instrumento_participante from anon;
grant select on public.escalas_instrumento_participante to authenticated;
