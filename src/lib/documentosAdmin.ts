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
