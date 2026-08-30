import { supabase } from "./supabase";
import type { SlugDocumento } from "./documentos";

export interface DocAdmin {
  id: string | null;
  slug: SlugDocumento;
  versao: string;
  titulo: string;
  corpo_html: string;
  ativo: boolean;
}

export const SLUGS_DOCUMENTO: {
  slug: SlugDocumento;
  rotulo: string;
  nota?: string;
}[] = [
  {
    slug: "informacoes_gerais",
    rotulo: "Informações gerais do estudo",
    nota: "Sugestão: texto do Anexo 9 (recrutamento). Edite ou mantenha.",
  },
  {
    slug: "tcle",
    rotulo: "Termo de Consentimento Livre e Esclarecido",
    nota: "Mantém os [COLCHETES] do documento-fonte; preencha os valores reais. Ajuste a versão ao alterar o texto.",
  },
  { slug: "instrucoes_gerais", rotulo: "Instruções para a tarefa de imaginação" },
  { slug: "encerramento", rotulo: "Mensagem de encerramento" },
  {
    slug: "desconforto",
    rotulo: "Página “Desconforto durante a pesquisa”",
    nota: "Sugestão: orientações éticas + contatos do TCLE. Edite ou mantenha.",
  },
  {
    slug: "ysq_instrucoes",
    rotulo: "Instruções — Questionário de Esquemas (YSQ-S3)",
    nota: "Aparece no topo do YSQ. Some se ficar em branco (a escala já basta).",
  },
  {
    slug: "panas_instrucoes",
    rotulo: "Instruções — Escala de Afetos (PANAS)",
    nota: "Reescrita aprovada: referência “neste momento” (sem “terapeuta”).",
  },
  {
    slug: "inelegibilidade",
    rotulo: "Mensagem de inelegibilidade",
    nota: "Exibida a quem não atende aos critérios no questionário inicial.",
  },
  {
    slug: "convite_email",
    rotulo: "E-mail de convite",
    nota: "Corpo HTML do e-mail enviado pelo Brevo. Placeholders: {{nome}} e {{link}}. O título deste documento vira o assunto do e-mail.",
  },
];

export async function carregarDocsDoEstudo(
  studyId: string,
): Promise<Record<string, DocAdmin>> {
  const { data } = await supabase
    .from("study_documents")
    .select("id, slug, versao, titulo, corpo_html, ativo")
    .eq("study_id", studyId)
    .eq("ativo", true);

  const mapa: Record<string, DocAdmin> = {};
  for (const d of (data ?? []) as DocAdmin[]) mapa[d.slug] = d;
  return mapa;
}

export async function salvarDocumento(
  studyId: string,
  doc: DocAdmin,
): Promise<{ error: string | null }> {
  if (doc.id) {
    const { error } = await supabase
      .from("study_documents")
      .update({ titulo: doc.titulo, corpo_html: doc.corpo_html, versao: doc.versao })
      .eq("id", doc.id);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("study_documents").insert({
    study_id: studyId,
    slug: doc.slug,
    versao: doc.versao || "1",
    titulo: doc.titulo,
    corpo_html: doc.corpo_html,
    ativo: true,
  });
  return { error: error?.message ?? null };
}
