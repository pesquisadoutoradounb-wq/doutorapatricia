-- =============================================================================
-- 0005 · Views seguras para o participante
--
-- Projeções que expõem SOMENTE o necessário. As views rodam com privilégio do
-- dono (não do invocador), então ignoram o RLS restritivo das tabelas-base;
-- por isso cada uma seleciona apenas colunas não sensíveis.
-- =============================================================================

-- Documentos ativos do estudo (informações, TCLE, instruções, encerramento,
-- desconforto). NÃO expõe versões inativas nem metadados de autoria.
create view public.documentos_estudo_publico as
  select slug, versao, titulo, corpo_html
  from public.study_documents
  where ativo;

grant select on public.documentos_estudo_publico to authenticated;

-- Texto-estímulo das vinhetas. NUNCA expõe dominio, titulo_interno ou
-- conteudo_predominante.
create view public.vinhetas_participante as
  select id, texto_estimulo
  from public.vignettes;

grant select on public.vinhetas_participante to authenticated;

-- Áudios de imaginação guiada.
create view public.audios_participante as
  select vignette_id, storage_path, duracao_segundos
  from public.audio_assets;

grant select on public.audios_participante to authenticated;
