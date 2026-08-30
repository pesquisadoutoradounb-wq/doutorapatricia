/**
 * Régua de valores inteiros (0–10 ou −5..+5) da avaliação pós-imaginação.
 * O 0 e os negativos são valores válidos — "em branco" é apenas `null`.
 */
export function EscalaNumerica({
  nome,
  min,
  max,
  rotuloMin,
  rotuloMax,
  valor,
  onChange,
  compacta = false,
  emBranco = false,
}: {
  nome: string;
  min: number;
  max: number;
  rotuloMin?: string;
  rotuloMax?: string;
  valor: number | null;
  onChange: (valor: number) => void;
  compacta?: boolean;
  emBranco?: boolean;
}) {
  const pontos: number[] = [];
  for (let v = min; v <= max; v++) pontos.push(v);

  return (
    <div className={`escala-num${compacta ? " escala-num--compacta" : ""}${emBranco ? " escala-num--branco" : ""}`}>
      {rotuloMin && !compacta && (
        <span className="escala-num__ponta">{min} — {rotuloMin}</span>
      )}
      <div className="escala-num__pontos" role="radiogroup" aria-label={nome}>
        {pontos.map((v) => (
          <label key={v} className="escala-num__ponto" title={String(v)}>
            <input
              type="radio"
              name={nome}
              checked={valor === v}
              onChange={() => onChange(v)}
            />
            <span>{v}</span>
          </label>
        ))}
      </div>
      {rotuloMax && !compacta && (
        <span className="escala-num__ponta">{max} — {rotuloMax}</span>
      )}
    </div>
  );
}
