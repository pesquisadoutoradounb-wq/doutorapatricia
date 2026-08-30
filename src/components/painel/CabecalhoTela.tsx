import type { ReactNode } from "react";

/**
 * Cabeçalho padrão das telas do painel (ERP): faixa fixa no topo do conteúdo
 * com sobretítulo → H1 serifado → filete dourado à esquerda, e uma área de
 * ações à direita (toggles, botões primários). O texto de apoio, quando
 * houver, entra logo abaixo, fora da faixa fixa.
 */
export function CabecalhoTela({
  sobretitulo,
  titulo,
  acoes,
  children,
}: {
  sobretitulo?: string;
  titulo: string;
  acoes?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="painel-topo">
        <div className="painel-topo__titulo">
          {sobretitulo && <span className="eyebrow">{sobretitulo}</span>}
          <h1>{titulo}</h1>
          <hr className="regua" />
        </div>
        {acoes && <div className="painel-topo__acoes">{acoes}</div>}
      </header>
      {children && <div className="painel-intro">{children}</div>}
    </>
  );
}
