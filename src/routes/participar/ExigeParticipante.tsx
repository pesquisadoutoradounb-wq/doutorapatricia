import type { ReactNode } from "react";
import { useParticipante, type DadosParticipante } from "../../lib/participanteContexto";

/**
 * Garante que há uma sessão de participante antes de renderizar a etapa.
 * Sem sessão (alguém abriu a URL sem o link de convite) → orientação, não erro.
 */
export function ExigeParticipante({
  children,
}: {
  children: (dados: DadosParticipante) => ReactNode;
}) {
  const { estado } = useParticipante();

  if (estado.fase === "carregando") {
    return <p role="status">Carregando…</p>;
  }

  if (estado.fase === "sem-sessao") {
    return (
      <div className="cartao">
        <h1>Use o seu link de convite</h1>
        <p>
          A participação nesta pesquisa acontece apenas pelo link individual
          enviado a você. Abra esse link para começar ou continuar de onde parou.
        </p>
      </div>
    );
  }

  return <>{children(estado.dados)}</>;
}
