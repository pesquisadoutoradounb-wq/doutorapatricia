import { useNavigate } from "react-router-dom";
import { DocumentoRenderizado } from "../../components/DocumentoRenderizado";
import { ExigeParticipante } from "./ExigeParticipante";

/**
 * Página "Desconforto durante a pesquisa", acessível pelo rodapé de qualquer
 * tela do participante. Conteúdo carregado do Supabase (slug `desconforto`).
 */
export function PaginaDesconforto() {
  const navigate = useNavigate();
  return (
    <ExigeParticipante>
      {(p) => (
        <div>
          <DocumentoRenderizado
            slug="desconforto"
            studyId={p.studyId}
            fallbackTitulo="Desconforto durante a pesquisa"
          />
          <p style={{ marginTop: "var(--espaco-6)" }}>
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>
          </p>
        </div>
      )}
    </ExigeParticipante>
  );
}
