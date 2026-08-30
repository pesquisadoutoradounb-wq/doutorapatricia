import type { PontoEscala } from "../../lib/instrumentos/basais";

/**
 * Legenda da escala, exibida uma vez no topo do instrumento. Os itens abaixo
 * mostram só os números; o rótulo de cada ponto fica acessível por aria-label.
 */
export function LegendaEscala({ pontos }: { pontos: PontoEscala[] }) {
  return (
    <dl className="legenda-escala">
      {pontos.map((p) => (
        <div key={p.valor} className="legenda-escala__item">
          <dt>{p.valor}</dt>
          <dd>{p.rotulo}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Um item de escala Likert (YSQ 1–6, PANAS 1–5). Grupo de rádios numerados;
 * `emBranco` realça um item deixado sem resposta.
 */
export function EscalaLikert({
  nome,
  enunciado,
  numero,
  pontos,
  valor,
  onChange,
  emBranco = false,
}: {
  nome: string;
  enunciado: string;
  numero?: number | string;
  pontos: PontoEscala[];
  valor: number | null;
  onChange: (valor: number) => void;
  emBranco?: boolean;
}) {
  return (
    <fieldset className={`likert${emBranco ? " likert--branco" : ""}`}>
      <legend className="likert__enunciado">
        {numero != null && <span className="likert__numero">{numero}.</span>}{" "}
        {enunciado}
      </legend>
      <div className="likert__pontos">
        {pontos.map((p) => (
          <label
            key={p.valor}
            className="likert__ponto"
            title={p.rotulo}
            aria-label={`${p.valor} — ${p.rotulo}`}
          >
            <input
              type="radio"
              name={nome}
              value={p.valor}
              checked={valor === p.valor}
              onChange={() => onChange(p.valor)}
            />
            <span className="likert__ponto-valor">{p.valor}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
