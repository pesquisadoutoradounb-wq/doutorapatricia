import { useEffect, useState } from "react";
import { ExigeParticipante } from "./ExigeParticipante";
import { consentimentoExistente } from "../../lib/consentimento";
import type { DadosParticipante } from "../../lib/participanteContexto";

/**
 * Via do TCLE para o participante salvar/imprimir (Salvar como PDF pelo
 * diálogo de impressão). Mostra o snapshot imutável do texto aceito + a
 * decisão e o momento do registro.
 */
export function ViaTcle() {
  return <ExigeParticipante>{(p) => <ViaInterna p={p} />}</ExigeParticipante>;
}

function ViaInterna({ p }: { p: DadosParticipante }) {
  const [reg, setReg] = useState<
    | { fase: "carregando" }
    | { fase: "sem" }
    | {
        fase: "ok";
        decisao: string;
        versao: string;
        snapshot: string;
        em: string;
      }
  >({ fase: "carregando" });

  useEffect(() => {
    consentimentoExistente(p.id).then((c) => {
      if (!c) return setReg({ fase: "sem" });
      setReg({
        fase: "ok",
        decisao: c.decisao,
        versao: c.tcle_versao,
        snapshot: c.tcle_texto_snapshot,
        em: c.registrado_em,
      });
    });
  }, [p.id]);

  if (reg.fase === "carregando") return <p role="status">Carregando…</p>;
  if (reg.fase === "sem") {
    return (
      <div className="cartao">
        <p>Nenhuma decisão de consentimento foi registrada ainda.</p>
      </div>
    );
  }

  return (
    <article className="via-tcle">
      <div className="via-tcle__acoes">
        <button type="button" className="botao" onClick={() => window.print()}>
          Salvar / imprimir
        </button>
      </div>

      <h1>Termo de Consentimento Livre e Esclarecido — via do participante</h1>
      <p className="documento__versao">
        {p.studyNome} · Versão do documento: {reg.versao}
      </p>

      <div dangerouslySetInnerHTML={{ __html: reg.snapshot }} />

      <hr />
      <p>
        <strong>Decisão registrada:</strong>{" "}
        {reg.decisao === "aceitou"
          ? "concordou em participar"
          : "não concordou em participar"}
        <br />
        <strong>Data e hora:</strong>{" "}
        {new Date(reg.em).toLocaleString("pt-BR")}
        <br />
        <strong>Identificador interno da participação:</strong> {p.id}
      </p>
    </article>
  );
}
