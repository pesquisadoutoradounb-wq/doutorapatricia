import { DocumentoRenderizado } from "../../components/DocumentoRenderizado";
import { ExigeParticipante } from "./ExigeParticipante";

export function Encerramento() {
  return (
    <ExigeParticipante>
      {(p) => (
        <DocumentoRenderizado
          slug="encerramento"
          studyId={p.studyId}
          fallbackTitulo="Encerramento"
        />
      )}
    </ExigeParticipante>
  );
}
