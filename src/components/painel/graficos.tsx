import { useId, useState } from "react";

/* Paleta validada (dataviz skill, instância de referência) — painel é fixo-claro.
   sequencial/ordinal azul: 250 #86b6ef · 350 #5598e7 · 450 #2a78d6 · 550 #1c5cab
   categórico: série 1 #2a78d6 (azul) · série 2 #eb6834 (laranja) */
const AZUL = "#2a78d6";
const LARANJA = "#eb6834";
const RAMPA = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];

// ---------------------------------------------------------------------------
export function CartaoKPI({
  valor,
  rotulo,
  sub,
}: {
  valor: string | number;
  rotulo: string;
  sub?: string;
}) {
  return (
    <div className="kpi">
      <span className="kpi__valor">{valor}</span>
      <span className="kpi__rotulo">{rotulo}</span>
      {sub && <span className="kpi__sub">{sub}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function BarrasH({
  titulo,
  dados,
  cor = AZUL,
}: {
  titulo: string;
  dados: { rotulo: string; valor: number }[];
  cor?: string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <figure className="grafico">
      <figcaption className="grafico__titulo">{titulo}</figcaption>
      {dados.length === 0 ? (
        <p className="grafico__vazio">Sem dados ainda.</p>
      ) : (
        <div className="barras">
          {dados.map((d) => (
            <div key={d.rotulo} className="barras__linha" title={`${d.rotulo}: ${d.valor}`}>
              <span className="barras__rotulo">{d.rotulo}</span>
              <span className="barras__trilho">
                <span
                  className="barras__fill"
                  style={{ width: `${(d.valor / max) * 100}%`, background: cor }}
                />
              </span>
              <span className="barras__valor">{d.valor}</span>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}

// ---------------------------------------------------------------------------
export function Funil({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { rotulo: string; valor: number }[];
}) {
  const topo = Math.max(1, dados[0]?.valor ?? 1);
  return (
    <figure className="grafico">
      <figcaption className="grafico__titulo">{titulo}</figcaption>
      <div className="funil">
        {dados.map((d, i) => {
          const pct = (d.valor / topo) * 100;
          return (
            <div key={d.rotulo} className="funil__etapa" title={`${d.rotulo}: ${d.valor}`}>
              <div className="funil__linha">
                <span className="funil__barra-wrap">
                  <span
                    className="funil__barra"
                    style={{ width: `${Math.max(pct, 2)}%`, background: RAMPA[i] ?? RAMPA.at(-1) }}
                  />
                </span>
                <span className="funil__valor">{d.valor}</span>
              </div>
              <span className="funil__rotulo">
                <span>{d.rotulo}</span>
                <span className="funil__pct">
                  {i === 0 ? "100%" : `${Math.round(pct)}%`}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------
export function LinhaTempo({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { data: string; convites: number; concluidos: number }[];
}) {
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (dados.length < 2) {
    return (
      <figure className="grafico">
        <figcaption className="grafico__titulo">{titulo}</figcaption>
        <p className="grafico__vazio">
          Dados insuficientes para a linha do tempo (aparece com envios ou
          conclusões em pelo menos dois dias).
        </p>
      </figure>
    );
  }

  const W = 640;
  const H = 220;
  const m = { t: 16, r: 56, b: 28, l: 36 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const maxY = Math.max(1, ...dados.map((d) => Math.max(d.convites, d.concluidos)));

  const x = (i: number) => m.l + (i / (dados.length - 1)) * iw;
  const y = (v: number) => m.t + ih - (v / maxY) * ih;
  const linha = (sel: (d: (typeof dados)[number]) => number) =>
    dados.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(sel(d))}`).join(" ");

  const ticksY = [0, Math.round(maxY / 2), maxY].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <figure className="grafico">
      <figcaption className="grafico__titulo">{titulo}</figcaption>
      <div className="linha-tempo">
        <div className="grafico__legenda">
          <span><i style={{ background: AZUL }} /> Convites (acumulado)</span>
          <span><i style={{ background: LARANJA }} /> Conclusões (acumulado)</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={titulo}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHover(null)}
        >
          {ticksY.map((v) => (
            <g key={v}>
              <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} className="lt-grade" />
              <text x={m.l - 8} y={y(v) + 4} className="lt-tick" textAnchor="end">
                {v}
              </text>
            </g>
          ))}

          <path d={linha((d) => d.convites)} className="lt-linha" stroke={AZUL} />
          <path d={linha((d) => d.concluidos)} className="lt-linha" stroke={LARANJA} />

          <text x={x(dados.length - 1) + 6} y={y(dados.at(-1)!.convites) + 4} className="lt-fim" fill={AZUL}>
            {dados.at(-1)!.convites}
          </text>
          <text x={x(dados.length - 1) + 6} y={y(dados.at(-1)!.concluidos) + 4} className="lt-fim" fill={LARANJA}>
            {dados.at(-1)!.concluidos}
          </text>

          <text x={m.l} y={H - 6} className="lt-tick" textAnchor="start">
            {formatarDia(dados[0].data)}
          </text>
          <text x={W - m.r} y={H - 6} className="lt-tick" textAnchor="end">
            {formatarDia(dados.at(-1)!.data)}
          </text>

          {dados.map((_, i) => (
            <rect
              key={`${uid}-${i}`}
              x={x(i) - iw / (dados.length - 1) / 2}
              y={m.t}
              width={iw / (dados.length - 1)}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}

          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} className="lt-cross" />
              <circle cx={x(hover)} cy={y(dados[hover].convites)} r={3.5} fill={AZUL} />
              <circle cx={x(hover)} cy={y(dados[hover].concluidos)} r={3.5} fill={LARANJA} />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="lt-tip">
            <strong>{formatarDia(dados[hover].data)}</strong>
            <span><i style={{ background: AZUL }} /> {dados[hover].convites} convites</span>
            <span><i style={{ background: LARANJA }} /> {dados[hover].concluidos} conclusões</span>
          </div>
        )}
      </div>
    </figure>
  );
}

function formatarDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
