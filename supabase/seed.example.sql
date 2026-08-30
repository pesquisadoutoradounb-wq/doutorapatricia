-- =============================================================================
-- SEED DE EXEMPLO — apenas placeholders.
--
-- NÃO contém texto real de instrumento. O conteúdo verdadeiro (TCLE, vinhetas,
-- instruções, encerramento, página de desconforto) é pré-CEP e sensível a
-- efeito de expectativa: fica em `supabase/seed.local.sql` (gitignorado) ou é
-- cadastrado pela equipe no painel administrativo (sub-projeto E).
--
-- Para uso local:  cp supabase/seed.example.sql supabase/seed.local.sql
--                  # edite seed.local.sql com os textos reais
--                  # e aponte [db].seed para ele, ou rode manualmente.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Documentos do estudo (placeholders)
-- ---------------------------------------------------------------------------
insert into public.study_documents (slug, versao, titulo, corpo_html, ativo) values
  ('informacoes_gerais', 'placeholder-0', 'Informações gerais do estudo',
   '<p><strong>PLACEHOLDER.</strong> Cadastrar o texto real conforme "Recrutamento e acesso à pesquisa" (PERGUNTAR 21).</p>', true),
  ('tcle', 'placeholder-0', 'Termo de Consentimento Livre e Esclarecido',
   '<p><strong>PLACEHOLDER.</strong> Cadastrar o TCLE real (PERGUNTAR 1 e 2). O texto exibido no aceite é gravado como snapshot imutável em consent_records.</p>', true),
  ('instrucoes_gerais', 'placeholder-0', 'Instruções para a tarefa de imaginação',
   '<p><strong>PLACEHOLDER.</strong> Cadastrar conforme "Instruções gerais ao participante".</p>', true),
  ('encerramento', 'placeholder-0', 'Encerramento',
   '<p><strong>PLACEHOLDER.</strong> Cadastrar conforme "Encerramento do procedimento experimental".</p>', true),
  ('desconforto', 'placeholder-0', 'Desconforto durante a pesquisa',
   '<p><strong>PLACEHOLDER.</strong> Cadastrar orientações éticas + contatos do TCLE (PERGUNTAR 22).</p>', true),
  ('ysq_instrucoes', 'placeholder-0', 'Instruções — Questionário de Esquemas (YSQ-S3)',
   '<p><strong>PLACEHOLDER.</strong> Texto de instrução do YSQ-S3 (some se não cadastrado; a escala já basta).</p>', true),
  ('panas_instrucoes', 'placeholder-0', 'Instruções — Escala de Afetos (PANAS)',
   '<p><strong>PLACEHOLDER.</strong> Instrução da PANAS reescrita para "neste momento" (PERGUNTAR 11).</p>', true),
  ('inelegibilidade', 'placeholder-0', 'Agradecemos seu interesse',
   '<p><strong>PLACEHOLDER.</strong> Mensagem de encerramento por inelegibilidade fornecida pela pesquisadora (PERGUNTAR 7).</p>', true),
  ('convite_email', 'placeholder-0', 'Convite para participar de uma pesquisa da UnB',
   '<p><strong>PLACEHOLDER.</strong> Corpo do e-mail de convite. Use {{nome}} e {{link}}.</p>', true)
on conflict (slug, versao) do nothing;

-- ---------------------------------------------------------------------------
-- Vinhetas — apenas a estrutura (10 linhas). Texto real vai em seed.local.sql.
-- IDs 1–5 = Domínio 1 (Direcionamento para o Outro); 6–10 = Domínio 2
-- (Supervigilância/Inibição) — PERGUNTAR 15.
-- ---------------------------------------------------------------------------
insert into public.vignettes (id, dominio, titulo_interno, conteudo_predominante, texto_estimulo) values
  (1, 1, 'PLACEHOLDER 1', null, 'PLACEHOLDER — texto-estímulo da situação 1'),
  (2, 1, 'PLACEHOLDER 2', null, 'PLACEHOLDER — texto-estímulo da situação 2'),
  (3, 1, 'PLACEHOLDER 3', null, 'PLACEHOLDER — texto-estímulo da situação 3'),
  (4, 1, 'PLACEHOLDER 4', null, 'PLACEHOLDER — texto-estímulo da situação 4'),
  (5, 1, 'PLACEHOLDER 5', null, 'PLACEHOLDER — texto-estímulo da situação 5'),
  (6, 2, 'PLACEHOLDER 6', null, 'PLACEHOLDER — texto-estímulo da situação 6'),
  (7, 2, 'PLACEHOLDER 7', null, 'PLACEHOLDER — texto-estímulo da situação 7'),
  (8, 2, 'PLACEHOLDER 8', null, 'PLACEHOLDER — texto-estímulo da situação 8'),
  (9, 2, 'PLACEHOLDER 9', null, 'PLACEHOLDER — texto-estímulo da situação 9'),
  (10, 2, 'PLACEHOLDER 10', null, 'PLACEHOLDER — texto-estímulo da situação 10')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Itens de instrumento (placeholders). Reais em seed.local.sql.
-- ---------------------------------------------------------------------------
insert into public.ysq_items (item, enunciado)
  select g, 'PLACEHOLDER — enunciado do item ' || g from generate_series(1, 90) g
on conflict (item) do nothing;

insert into public.panas_items (item, termo)
  select g, 'PLACEHOLDER ' || g from generate_series(1, 19) g
on conflict (item) do nothing;

insert into public.instrument_scale_points (instrumento, valor, rotulo) values
  ('ysq', 1, 'PLACEHOLDER 1'), ('ysq', 2, 'PLACEHOLDER 2'), ('ysq', 3, 'PLACEHOLDER 3'),
  ('ysq', 4, 'PLACEHOLDER 4'), ('ysq', 5, 'PLACEHOLDER 5'), ('ysq', 6, 'PLACEHOLDER 6'),
  ('panas', 1, 'PLACEHOLDER 1'), ('panas', 2, 'PLACEHOLDER 2'), ('panas', 3, 'PLACEHOLDER 3'),
  ('panas', 4, 'PLACEHOLDER 4'), ('panas', 5, 'PLACEHOLDER 5')
on conflict (instrumento, valor) do nothing;
