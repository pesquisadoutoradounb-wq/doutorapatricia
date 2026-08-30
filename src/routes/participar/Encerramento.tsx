import { useEffect, useRef } from "react";
import { DocumentoRenderizado } from "../../components/DocumentoRenderizado";
import { ExigeParticipante } from "./ExigeParticipante";
import { useParticipante } from "../../lib/participanteContexto";
import { concluirParticipacao } from "../../lib/vinhetas/vinhetasFluxo";

/**
 * Encerramento. Ao chegar aqui pela primeira vez (etapa `encerramento`), marca
 * a participação como concluída (RPC `concluir_participacao`): grava
 * `concluido_em`, move para `concluido` e fecha o convite. Idempotente.
 */
export function Encerramento() {
  const { estado, recarregar } = useParticipante();
  const jaChamou = useRef(false);

  useEffect(() => {
    if (jaChamou.current) return;
    if (estado.fase !== "ok" || estado.dados.etapaAtual !== "encerramento") return;
    jaChamou.current = true;
    concluirParticipacao().then(({ error }) => {
      if (!error) recarregar();
    });
  }, [estado, recarregar]);

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
