/**
 * Selo de status — pílula colorida para tabelas do painel (status de convite,
 * etapa do participante, modo piloto/produção, ativo/inativo…).
 * O tom é semântico; o texto é livre.
 */

import type { ReactNode } from "react";

export type TomSelo = "neutro" | "info" | "sucesso" | "aviso" | "erro";

export function Selo({
  children,
  tom = "neutro",
  ponto = true,
}: {
  children: ReactNode;
  tom?: TomSelo;
  ponto?: boolean;
}) {
  return (
    <span className={`selo selo--${tom}`}>
      {ponto && <i className="selo__ponto" aria-hidden="true" />}
      {children}
    </span>
  );
}
