import { supabase } from "./supabase";

/**
 * Textos do estudo (informações gerais, TCLE, instruções, encerramento, página
 * de desconforto). Vivem apenas no Supabase — nunca no bundle — porque são
 * pré-CEP e não devem ser indexados publicamente.
 *
 * A view `documentos_estudo_publico` expõe somente a versão ativa de cada
 * documento, por estudo, a participantes autenticados.
 */
export type SlugDocumento =
  | "informacoes_gerais"
  | "tcle"
  | "instrucoes_gerais"
  | "encerramento"
  | "desconforto";

export interface DocumentoEstudo {
  slug: SlugDocumento;
  versao: string;
  titulo: string;
  corpo_html: string;
}

export async function carregarDocumento(
  slug: SlugDocumento,
  studyId: string,
): Promise<DocumentoEstudo | null> {
  const { data, error } = await supabase
    .from("documentos_estudo_publico")
    .select("slug, versao, titulo, corpo_html")
    .eq("study_id", studyId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(`[documentos] falha ao carregar "${slug}":`, error.message);
    return null;
  }
  return (data as DocumentoEstudo | null) ?? null;
}
