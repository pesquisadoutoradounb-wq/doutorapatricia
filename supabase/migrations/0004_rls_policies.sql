-- =============================================================================
-- 0004 · Grants + políticas RLS
--
-- Princípio: negar por padrão. Revogamos tudo de anon/authenticated e
-- concedemos privilégio a privilégio; o RLS restringe ainda mais por linha.
--
--   anon ........... nenhum acesso (o participante primeiro faz signInAnonymously
--                    e vira "authenticated")
--   authenticated .. participante (current_participant_id() não nulo) OU
--                    admin (is_admin() verdadeiro)
--   service_role ... Edge Functions; ignora RLS (usado só onde é inevitável:
--                    validar token, criar participant, sortear ordem, webhooks)
-- =============================================================================

revoke all on all tables in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------
-- research_admins
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.research_admins to authenticated;

create policy admins_select on public.research_admins
  for select to authenticated using (public.is_admin());

create policy admins_insert on public.research_admins
  for insert to authenticated with check (public.admin_role() = 'admin');

create policy admins_update on public.research_admins
  for update to authenticated
  using (public.admin_role() = 'admin') with check (public.admin_role() = 'admin');

create policy admins_delete on public.research_admins
  for delete to authenticated using (public.admin_role() = 'admin');

-- ---------------------------------------------------------------------------
-- invites — sem acesso de participante. Token só é lido em Edge Function.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.invites to authenticated;

create policy invites_select on public.invites
  for select to authenticated using (public.is_admin());

create policy invites_insert on public.invites
  for insert to authenticated with check (public.admin_pode_escrever());

create policy invites_update on public.invites
  for update to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

create policy invites_delete on public.invites
  for delete to authenticated using (public.admin_role() = 'admin');

-- ---------------------------------------------------------------------------
-- participants — participante lê só a si; atualiza SÓ etapa_atual.
-- Inserção é exclusiva do service_role (Edge Function iniciar-participacao).
-- ---------------------------------------------------------------------------
grant select on public.participants to authenticated;
grant update (etapa_atual) on public.participants to authenticated;

create policy participants_select on public.participants
  for select to authenticated
  using (id = public.current_participant_id() or public.is_admin());

create policy participants_update_etapa on public.participants
  for update to authenticated
  using (id = public.current_participant_id())
  with check (id = public.current_participant_id());

-- ---------------------------------------------------------------------------
-- study_documents — gestão só de admin. Participante lê via view (0005).
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.study_documents to authenticated;

create policy docs_select on public.study_documents
  for select to authenticated using (public.is_admin());

create policy docs_insert on public.study_documents
  for insert to authenticated with check (public.admin_pode_escrever());

create policy docs_update on public.study_documents
  for update to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

create policy docs_delete on public.study_documents
  for delete to authenticated using (public.admin_role() = 'admin');

-- ---------------------------------------------------------------------------
-- consent_records — participante insere e lê o próprio; append-only
-- (sem UPDATE/DELETE para ninguém; trigger em 0006 reforça).
-- ---------------------------------------------------------------------------
grant select, insert on public.consent_records to authenticated;

create policy consent_insert on public.consent_records
  for insert to authenticated
  with check (participant_id = public.current_participant_id());

create policy consent_select on public.consent_records
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Helper de política para as tabelas de resposta: dono OU admin (select),
-- dono (escrita). Repetição explícita por clareza de auditoria.
-- ---------------------------------------------------------------------------

-- sociodemographic_responses
grant select, insert, update on public.sociodemographic_responses to authenticated;
create policy socio_select on public.sociodemographic_responses
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());
create policy socio_insert on public.sociodemographic_responses
  for insert to authenticated
  with check (participant_id = public.current_participant_id());
create policy socio_update on public.sociodemographic_responses
  for update to authenticated
  using (participant_id = public.current_participant_id())
  with check (participant_id = public.current_participant_id());

-- ysq_item_responses
grant select, insert, update on public.ysq_item_responses to authenticated;
create policy ysq_select on public.ysq_item_responses
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());
create policy ysq_insert on public.ysq_item_responses
  for insert to authenticated
  with check (participant_id = public.current_participant_id());
create policy ysq_update on public.ysq_item_responses
  for update to authenticated
  using (participant_id = public.current_participant_id())
  with check (participant_id = public.current_participant_id());

-- ysq_completions
grant select, insert on public.ysq_completions to authenticated;
create policy ysq_comp_select on public.ysq_completions
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());
create policy ysq_comp_insert on public.ysq_completions
  for insert to authenticated
  with check (participant_id = public.current_participant_id());

-- panas_item_responses
grant select, insert, update on public.panas_item_responses to authenticated;
create policy panas_select on public.panas_item_responses
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());
create policy panas_insert on public.panas_item_responses
  for insert to authenticated
  with check (participant_id = public.current_participant_id());
create policy panas_update on public.panas_item_responses
  for update to authenticated
  using (participant_id = public.current_participant_id())
  with check (participant_id = public.current_participant_id());

-- panas_completions
grant select, insert on public.panas_completions to authenticated;
create policy panas_comp_select on public.panas_completions
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());
create policy panas_comp_insert on public.panas_completions
  for insert to authenticated
  with check (participant_id = public.current_participant_id());

-- ---------------------------------------------------------------------------
-- vignettes / audio_assets — base só admin. Participante lê via view (0005).
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.vignettes to authenticated;
create policy vign_select on public.vignettes
  for select to authenticated using (public.is_admin());
create policy vign_insert on public.vignettes
  for insert to authenticated with check (public.admin_pode_escrever());
create policy vign_update on public.vignettes
  for update to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());
create policy vign_delete on public.vignettes
  for delete to authenticated using (public.admin_role() = 'admin');

grant select, insert, update, delete on public.audio_assets to authenticated;
create policy audio_select on public.audio_assets
  for select to authenticated using (public.is_admin());
create policy audio_write on public.audio_assets
  for all to authenticated
  using (public.admin_pode_escrever()) with check (public.admin_pode_escrever());

-- ---------------------------------------------------------------------------
-- vignette_order — participante lê a própria ordem; geração é do service_role.
-- ---------------------------------------------------------------------------
grant select on public.vignette_order to authenticated;
create policy vorder_select on public.vignette_order
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());

-- ---------------------------------------------------------------------------
-- vignette_responses
-- ---------------------------------------------------------------------------
grant select, insert, update on public.vignette_responses to authenticated;
create policy vresp_select on public.vignette_responses
  for select to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());
create policy vresp_insert on public.vignette_responses
  for insert to authenticated
  with check (participant_id = public.current_participant_id());
create policy vresp_update on public.vignette_responses
  for update to authenticated
  using (participant_id = public.current_participant_id())
  with check (participant_id = public.current_participant_id());

-- ---------------------------------------------------------------------------
-- email_events — leitura de admin; escrita só do service_role (webhook).
-- ---------------------------------------------------------------------------
grant select on public.email_events to authenticated;
create policy email_events_select on public.email_events
  for select to authenticated using (public.is_admin());
