/** Barra de progresso "Bloco X de Y" para o YSQ-S3. */
export function BlocoProgresso({ atual, total }: { atual: number; total: number }) {
  const pct = Math.round((atual / total) * 100);
  return (
    <div className="bloco-progresso">
      <span className="bloco-progresso__rotulo">
        Bloco {atual} de {total}
      </span>
      <span className="bloco-progresso__trilho" aria-hidden="true">
        <span className="bloco-progresso__barra" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
