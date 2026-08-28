-- =============================================================================
-- 0007 · Bucket de Storage para os áudios de imaginação guiada
--
-- PERGUNTAR 13: 1 áudio genérico ou 10 (um por vinheta)? A estrutura suporta
-- os dois; o bucket é o mesmo.
--
-- Bucket público: os áudios não contêm PII e o cache do CDN ajuda a
-- experiência. Se o CEP pedir acesso restrito, trocar `public` para false e
-- servir por URL assinada via Edge Function.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('audios', 'audios', true)
on conflict (id) do nothing;

-- Leitura: pública (bucket público). Escrita/gestão: só admin com permissão.
create policy "audios leitura publica"
  on storage.objects for select
  using (bucket_id = 'audios');

create policy "audios escrita admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'audios' and public.admin_pode_escrever());

create policy "audios update admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'audios' and public.admin_pode_escrever())
  with check (bucket_id = 'audios' and public.admin_pode_escrever());

create policy "audios delete admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'audios' and public.admin_role() = 'admin');
