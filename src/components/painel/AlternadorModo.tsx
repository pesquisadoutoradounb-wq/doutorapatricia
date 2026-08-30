/**
 * Alternador "incluir pilotos". O padrão da plataforma é mostrar só dados de
 * produção; marcar aqui inclui os convites/participantes de teste.
 */
export function AlternadorModo({
  incluirPiloto,
  onChange,
}: {
  incluirPiloto: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="alternador-modo">
      <input
        type="checkbox"
        checked={incluirPiloto}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>Incluir dados de teste (piloto)</span>
    </label>
  );
}
