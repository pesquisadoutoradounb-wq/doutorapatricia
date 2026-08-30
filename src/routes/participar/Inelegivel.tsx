import { useEffect, useState } from "react";
import { carregarDocumento } from "../../lib/documentos";
import { useParticipante } from "../../lib/participanteContexto";

/**
 * Tela terminal de inelegibilidade (PERGUNTAR 7). O participante respondeu o
 * sociodemográfico inteiro e não atendeu a um ou mais critérios (idade / seção
 * C). Texto editável no painel (study_documents slug `inelegibilidade`); o
 * fallback é a mensagem fornecida pela pesquisadora.
 */
const FALLBACK_PARAGRAFOS = [
  "Agradecemos seu interesse em participar desta pesquisa.",
  "Com base nas informações fornecidas no questionário inicial, verificamos que, neste momento, um ou mais critérios necessários para participação no estudo não foram atendidos.",
  "Esses critérios foram previamente definidos de acordo com as características e os procedimentos da pesquisa e incluem requisitos relacionados à idade e às condições técnicas necessárias para a realização das atividades propostas.",
  "Por esse motivo, não será possível prosseguir para as próximas etapas do estudo.",
  "Agradecemos sinceramente sua disponibilidade, seu tempo e seu interesse em contribuir com a pesquisa. Sua participação até este momento é muito importante para nós.",
  "Muito obrigado(a) por sua colaboração.",
];

export function Inelegivel() {
  const { estado } = useParticipante();
  const studyId = estado.fase === "ok" ? estado.dados.studyId : null;
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!studyId) return;
    let vivo = true;
    carregarDocumento("inelegibilidade", studyId)
      .then((doc) => vivo && setHtml(doc?.corpo_html ?? null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [studyId]);

  return (
    <div className="cartao">
      <div className="tela-titulo">
        <span className="eyebrow">Participação encerrada</span>
        <h1>Agradecemos seu interesse</h1>
        <hr className="regua" />
      </div>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        FALLBACK_PARAGRAFOS.map((t, i) => <p key={i}>{t}</p>)
      )}
    </div>
  );
}
