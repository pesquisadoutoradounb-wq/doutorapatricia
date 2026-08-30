import { useEffect, useState } from "react";
import { carregarDocumento, type SlugDocumento } from "../../lib/documentos";

/**
 * Bloco de instrução no topo de um instrumento (YSQ, PANAS). Texto editável no
 * painel (study_documents); some silenciosamente se o slug ainda não foi
 * cadastrado — a escala já basta para responder.
 */
export function InstrucaoInstrumento({
  slug,
  studyId,
}: {
  slug: SlugDocumento;
  studyId: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    carregarDocumento(slug, studyId)
      .then((doc) => vivo && setHtml(doc?.corpo_html ?? null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [slug, studyId]);

  if (!html) return null;
  return (
    <div
      className="instrucao-instrumento"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
