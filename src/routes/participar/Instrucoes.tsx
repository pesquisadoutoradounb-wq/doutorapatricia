import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentoRenderizado } from "../../components/DocumentoRenderizado";
import type { DadosParticipante } from "../../lib/participanteContexto";
import { useParticipante } from "../../lib/participanteContexto";
import { avancarEtapa, rotaDaEtapa } from "../../lib/participantSession";
import { gerarOuCarregarOrdem } from "../../lib/vinhetas/vinhetasFluxo";

/**
 * Etapa `instrucoes` — instruções gerais da tarefa de imaginação. "Iniciar"
 * sorteia (uma vez) a ordem das 10 vinhetas e avança para o bloco.
 */
export function Instrucoes({ p }: { p: DadosParticipante }) {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function iniciar() {
    setErro(null);
    setIndo(true);
    try {
      await gerarOuCarregarOrdem();
    } catch {
      setIndo(false);
      setErro(
        "Não foi possível iniciar a tarefa agora. Verifique sua conexão e tente novamente.",
      );
      return;
    }
    await avancarEtapa(p.id, "vinhetas");
    await recarregar();
    navigate(rotaDaEtapa("vinhetas"), { replace: true });
  }

  return (
    <div>
      <DocumentoRenderizado
        slug="instrucoes_gerais"
        studyId={p.studyId}
        fallbackTitulo="Instruções para a tarefa de imaginação"
      />
      {erro && <p className="erro-caixa">{erro}</p>}
      <div style={{ marginTop: "var(--espaco-6)" }}>
        <button type="button" className="botao" disabled={indo} onClick={iniciar}>
          {indo ? "Iniciando…" : "Iniciar"}
        </button>
      </div>
    </div>
  );
}
