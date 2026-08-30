import { Navigate, useParams } from "react-router-dom";
import { ExigeParticipante } from "./ExigeParticipante";
import { EtapaPlaceholder } from "./EtapaPlaceholder";
import { Sociodemografico } from "./Sociodemografico";
import { Ysq } from "./Ysq";
import { Panas } from "./Panas";
import { rotaDaEtapa } from "../../lib/participantSession";
import type { DadosParticipante } from "../../lib/participanteContexto";

/**
 * Rota `/participar/etapa/:etapa`. Garante sessão, garante que a etapa da URL é
 * de fato a etapa atual do participante (senão redireciona para a certa —
 * retomada e proteção contra pulo) e despacha para a tela do instrumento.
 *
 * `instrucoes` e `vinhetas` seguem no placeholder até o sub-projeto D.
 */
export function EtapaInstrumento() {
  const { etapa = "" } = useParams();
  return (
    <ExigeParticipante>
      {(p) => <Despacho etapa={etapa} p={p} />}
    </ExigeParticipante>
  );
}

function Despacho({ etapa, p }: { etapa: string; p: DadosParticipante }) {
  if (etapa !== p.etapaAtual) {
    return <Navigate to={rotaDaEtapa(p.etapaAtual)} replace />;
  }
  switch (etapa) {
    case "sociodemografico":
      return <Sociodemografico p={p} />;
    case "ysq":
      return <Ysq p={p} />;
    case "panas":
      return <Panas p={p} />;
    default:
      return <EtapaPlaceholder />;
  }
}
