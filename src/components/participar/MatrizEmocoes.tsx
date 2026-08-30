import { EscalaNumerica } from "./EscalaNumerica";

export interface ValorMatriz {
  [chave: string]: number | { rotulo: string; valor: number } | undefined;
  outra?: { rotulo: string; valor: number };
}

/**
 * Matriz de linhas rotuladas, cada uma com uma régua 0–10 (Q3b emoções, Q12b
 * tendências). `comOutra` acrescenta uma linha com rótulo livre.
 */
export function MatrizEmocoes({
  nome,
  linhas,
  valor,
  onChange,
  comOutra = false,
}: {
  nome: string;
  linhas: readonly { chave: string; rotulo: string }[];
  valor: ValorMatriz | null;
  onChange: (valor: ValorMatriz) => void;
  comOutra?: boolean;
}) {
  const atual: ValorMatriz = valor ?? {};

  function setLinha(chave: string, v: number) {
    onChange({ ...atual, [chave]: v });
  }
  function setOutraRotulo(rotulo: string) {
    const prev = atual.outra ?? { rotulo: "", valor: 0 };
    onChange({ ...atual, outra: { ...prev, rotulo } });
  }
  function setOutraValor(v: number) {
    const prev = atual.outra ?? { rotulo: "", valor: 0 };
    onChange({ ...atual, outra: { ...prev, valor: v } });
  }

  return (
    <div className="matriz-emocoes">
      {linhas.map((l) => (
        <div key={l.chave} className="matriz-emocoes__linha">
          <span className="matriz-emocoes__rotulo">{l.rotulo}</span>
          <EscalaNumerica
            nome={`${nome}-${l.chave}`}
            min={0}
            max={10}
            valor={typeof atual[l.chave] === "number" ? (atual[l.chave] as number) : null}
            onChange={(v) => setLinha(l.chave, v)}
            compacta
          />
        </div>
      ))}
      {comOutra && (
        <div className="matriz-emocoes__linha matriz-emocoes__linha--outra">
          <input
            type="text"
            placeholder="Outra tendência (opcional)"
            value={atual.outra?.rotulo ?? ""}
            onChange={(e) => setOutraRotulo(e.target.value)}
          />
          <EscalaNumerica
            nome={`${nome}-outra`}
            min={0}
            max={10}
            valor={atual.outra?.valor ?? null}
            onChange={setOutraValor}
            compacta
          />
        </div>
      )}
    </div>
  );
}
