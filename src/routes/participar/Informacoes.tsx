import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentoRenderizado } from "../../components/DocumentoRenderizado";
import { ExigeParticipante } from "./ExigeParticipante";
import { avancarEtapa, rotaDaEtapa } from "../../lib/participantSession";
import { useParticipante } from "../../lib/participanteContexto";

/**
 * Etapa 1 — Informações gerais do estudo (conteúdo de `informacoes_gerais`,
 * conforme "Recrutamento e acesso à pesquisa" / Anexo 9).
 */
export function Informacoes() {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();
  const [indo, setIndo] = useState(false);

  return (
    <ExigeParticipante>
      {(p) => (
        <div>
          <DocumentoRenderizado
            slug="informacoes_gerais"
            studyId={p.studyId}
            fallbackTitulo="Informações gerais do estudo"
          />
          <div style={{ marginTop: "var(--espaco-6)" }}>
            <button
              type="button"
              className="botao"
              disabled={indo}
              onClick={async () => {
                setIndo(true);
                await avancarEtapa(p.id, "tcle");
                await recarregar();
                navigate(rotaDaEtapa("tcle"), { replace: true });
              }}
            >
              {indo ? "Continuando…" : "Continuar"}
            </button>
          </div>
        </div>
      )}
    </ExigeParticipante>
  );
}
