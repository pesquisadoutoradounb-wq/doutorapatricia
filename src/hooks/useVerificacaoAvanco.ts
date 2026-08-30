import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  contarEmBranco,
  decisaoPorBranco,
  type ValorItem,
} from "../lib/instrumentos/respostasBranco";
import { encerrarParticipacao, rotaDaEtapa } from "../lib/participantSession";
import { useParticipante } from "../lib/participanteContexto";

/**
 * Fluxo comum das telas de instrumento ao clicar em "Continuar" / "Concluir":
 * conta as respostas em branco aplicáveis e decide seguir, avisar (uma vez) ou
 * abrir o modal de abandono. Confirmar o abandono leva a etapa_atual a
 * 'interrompido' (PERGUNTAR 19).
 */
export function useVerificacaoAvanco(
  participantId: string,
  aoAvancar: () => void | Promise<void>,
) {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();

  const [aviso, setAviso] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroAbandono, setErroAbandono] = useState<string | null>(null);

  const tentarAvancar = useCallback(
    async (valoresAplicaveis: ValorItem[]) => {
      const decisao = decisaoPorBranco(contarEmBranco(valoresAplicaveis));
      if (decisao === "modal") {
        setModalAberto(true);
        return;
      }
      if (decisao === "avisar" && !aviso) {
        setAviso(true);
        return;
      }
      setAviso(false);
      await aoAvancar();
    },
    [aviso, aoAvancar],
  );

  const cancelarAbandono = useCallback(() => {
    setModalAberto(false);
    setErroAbandono(null);
  }, []);

  const confirmarAbandono = useCallback(async () => {
    setConfirmando(true);
    setErroAbandono(null);
    const { error } = await encerrarParticipacao(participantId, "interrompido");
    if (error) {
      setConfirmando(false);
      setErroAbandono("Não foi possível concluir agora. Tente novamente.");
      return;
    }
    await recarregar();
    navigate(rotaDaEtapa("interrompido"), { replace: true });
  }, [participantId, navigate, recarregar]);

  /** Zera o aviso quando o participante volta a mexer nas respostas. */
  const limparAviso = useCallback(() => setAviso(false), []);

  return {
    aviso,
    modalAberto,
    confirmando,
    erroAbandono,
    tentarAvancar,
    cancelarAbandono,
    confirmarAbandono,
    limparAviso,
  };
}
