import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { entrarComToken, rotaDaEtapa } from "../../lib/participantSession";
import { useParticipante } from "../../lib/participanteContexto";

/**
 * Rota /participar/:token — ponto de entrada do participante.
 *
 * Troca o token por uma sessão e encaminha para a etapa atual (retomada).
 * Token inválido/expirado/concluído → mensagem apropriada, nunca erro técnico.
 */
export function EntrarComToken() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { recarregar } = useParticipante();
  const [falha, setFalha] = useState<string | null>(null);
  const jaRodou = useRef(false);

  useEffect(() => {
    if (jaRodou.current) return;
    jaRodou.current = true;

    entrarComToken(token).then(async (r) => {
      if (r.ok) {
        await recarregar();
        navigate(rotaDaEtapa(r.sessao.etapaAtual), { replace: true });
        return;
      }
      setFalha(r.motivo);
    });
  }, [token, navigate, recarregar]);

  if (!falha) {
    return <p role="status">Verificando seu convite…</p>;
  }

  const mensagens: Record<string, { titulo: string; corpo: string }> = {
    token_invalido: {
      titulo: "Convite não reconhecido",
      corpo:
        "Este link de convite não foi reconhecido. Verifique se copiou o endereço completo enviado a você. Se o problema continuar, entre em contato com a equipe de pesquisa.",
    },
    token_expirado: {
      titulo: "Convite expirado",
      corpo:
        "O prazo para participar por meio deste convite terminou. Se ainda desejar participar, entre em contato com a equipe de pesquisa.",
    },
    ja_concluido: {
      titulo: "Participação já concluída",
      corpo:
        "As respostas vinculadas a este convite já foram concluídas. Agradecemos pela sua participação.",
    },
    erro_rede: {
      titulo: "Não foi possível conectar",
      corpo:
        "Houve um problema de conexão ao abrir a pesquisa. Verifique sua internet e recarregue a página.",
    },
  };

  const m = mensagens[falha] ?? mensagens.erro_rede;
  return (
    <div className="cartao">
      <h1>{m.titulo}</h1>
      <p>{m.corpo}</p>
    </div>
  );
}
