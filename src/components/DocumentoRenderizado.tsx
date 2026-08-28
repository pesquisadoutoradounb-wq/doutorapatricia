import { useEffect, useState } from "react";
import { carregarDocumento, type SlugDocumento, type DocumentoEstudo } from "../lib/documentos";

/**
 * Renderiza um documento do estudo carregado do Supabase.
 *
 * O corpo é HTML confiável, redigido pela equipe e armazenado no banco (não é
 * entrada de usuário). Na fase de edição (painel) passará por sanitização
 * antes de gravar.
 */
export function DocumentoRenderizado({
  slug,
  studyId,
  fallbackTitulo,
  onCarregado,
}: {
  slug: SlugDocumento;
  studyId: string;
  fallbackTitulo: string;
  onCarregado?: (doc: DocumentoEstudo) => void;
}) {
  const [estado, setEstado] = useState<
    | { fase: "carregando" }
    | { fase: "ok"; doc: DocumentoEstudo }
    | { fase: "ausente" }
    | { fase: "erro" }
  >({ fase: "carregando" });

  useEffect(() => {
    let vivo = true;
    carregarDocumento(slug, studyId)
      .then((doc) => {
        if (!vivo) return;
        if (doc) {
          setEstado({ fase: "ok", doc });
          onCarregado?.(doc);
        } else {
          setEstado({ fase: "ausente" });
        }
      })
      .catch(() => vivo && setEstado({ fase: "erro" }));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, studyId]);

  if (estado.fase === "carregando") {
    return <p role="status">Carregando…</p>;
  }

  if (estado.fase === "ausente") {
    return (
      <div className="cartao">
        <h1>{fallbackTitulo}</h1>
        <div className="aviso">
          O texto deste documento ainda não foi cadastrado no sistema
          (<code>{slug}</code>). A equipe de pesquisa deve cadastrá-lo no painel
          antes da coleta.
        </div>
      </div>
    );
  }

  if (estado.fase === "erro") {
    return (
      <div className="erro-caixa">
        Não foi possível carregar este conteúdo agora. Tente recarregar a página.
      </div>
    );
  }

  return (
    <article className="cartao documento">
      <div className="tela-titulo">
        <span className="eyebrow">Documento do estudo</span>
        <h1>{estado.doc.titulo}</h1>
        <hr className="regua" />
      </div>
      <div dangerouslySetInnerHTML={{ __html: estado.doc.corpo_html }} />
      <p className="documento__versao">Versão do documento: {estado.doc.versao}</p>
    </article>
  );
}
