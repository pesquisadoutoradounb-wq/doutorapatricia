import type { ReactNode } from "react";

/**
 * Cartão de tabela do painel: cabeçalho (título + contagem de registros +
 * ações opcionais) e um container com rolagem horizontal em telas estreitas.
 * A `<table className="tabela">` entra como filho.
 */
export function TabelaCartao({
  titulo,
  contagem,
  acoes,
  children,
}: {
  titulo: string;
  contagem?: number;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tabela-cartao">
      <div className="tabela-cartao__cabeca">
        <div className="tabela-cartao__id">
          <h2>{titulo}</h2>
          {contagem !== undefined && (
            <span className="tabela-cartao__contagem">
              {contagem} {contagem === 1 ? "registro" : "registros"}
            </span>
          )}
        </div>
        {acoes && <div className="tabela-cartao__acoes">{acoes}</div>}
      </div>
      <div className="tabela-cartao__scroll">{children}</div>
    </section>
  );
}
