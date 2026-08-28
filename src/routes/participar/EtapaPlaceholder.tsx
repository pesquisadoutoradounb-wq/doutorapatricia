import { useParams } from "react-router-dom";
import { ETAPAS, type Etapa } from "../../lib/participantSession";

/**
 * Placeholder das etapas do fluxo do participante.
 *
 * Sub-projeto A entrega apenas o esqueleto de sessão e navegação. O conteúdo
 * real de cada etapa (informações gerais, TCLE, sociodemográfico, YSQ-S3,
 * PANAS, instruções, vinhetas) chega nos sub-projetos B, C e D.
 */
const ROTULOS: Record<Etapa, string> = {
  informacoes: "Informações gerais do estudo",
  tcle: "Termo de Consentimento Livre e Esclarecido",
  sociodemografico: "Questionário Sociodemográfico e Clínico",
  ysq: "Questionário de Esquemas (YSQ-S3)",
  panas: "Escala de Afetos Positivos e Negativos (PANAS)",
  instrucoes: "Instruções para a tarefa de imaginação",
  vinhetas: "Tarefa de imaginação",
  encerramento: "Encerramento",
  concluido: "Concluído",
};

export function EtapaPlaceholder() {
  const { etapa } = useParams();
  const valida = (ETAPAS as readonly string[]).includes(etapa ?? "");
  const e = etapa as Etapa;

  return (
    <div className="cartao">
      <div className="tela-titulo">
        <span className="eyebrow">Etapa da pesquisa</span>
        <h1>{valida ? ROTULOS[e] : "Etapa desconhecida"}</h1>
        <hr className="regua" />
      </div>
      <div className="aviso">
        Etapa <code>{etapa}</code> — ainda não implementada. O modelo de sessão,
        rotas e retomada já estão funcionando; o conteúdo dos instrumentos entra
        nas próximas fases.
      </div>
    </div>
  );
}
