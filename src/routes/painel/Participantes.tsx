import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { reenviarConvite } from "../../lib/convitesAdmin";
import {
  definirDescarte,
  listarParticipantes,
  pseudonimoCurto,
  tempoTotal,
  type ParticipanteAdmin,
} from "../../lib/participantesAdmin";

const ROTULO_ETAPA: Record<string, string> = {
  informacoes: "Informações",
  tcle: "Consentimento",
  sociodemografico: "Sociodemográfico",
  ysq: "YSQ-S3",
  panas: "PANAS",
  instrucoes: "Instruções",
  vinhetas: "Vinhetas",
  encerramento: "Encerramento",
  concluido: "Concluído",
  inelegivel: "Inelegível",
  interrompido: "Interrompeu",
};

export function Participantes() {
  const estudo = useEstudo();
  const [incluirPiloto, setIncluirPiloto] = useState(false);
  const [incluirDescartados, setIncluirDescartados] = useState(false);
  const [lista, setLista] = useState<ParticipanteAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function recarregar(studyId: string) {
    setLista(
      await listarParticipantes(studyId, { incluirPiloto, incluirDescartados }),
    );
  }

  useEffect(() => {
    if (estudo) recarregar(estudo.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudo?.id, incluirPiloto, incluirDescartados]);

  if (!estudo || lista === null) return <p role="status">Carregando…</p>;

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">{estudo.nome}</span>
        <h1>Participantes</h1>
        <hr className="regua" />
      </div>
      <p className="documento__versao">
        Lista pseudônima — sem nome ou e-mail. Use a tela de Convites para os
        dados de contato.
      </p>

      <div style={{ display: "flex", gap: "var(--espaco-6)", flexWrap: "wrap", margin: "var(--espaco-4) 0" }}>
        <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
        <label className="alternador-modo">
          <input
            type="checkbox"
            checked={incluirDescartados}
            onChange={(e) => setIncluirDescartados(e.target.checked)}
          />
          <span>Mostrar descartados</span>
        </label>
      </div>

      {erro && <p className="erro-caixa">{erro}</p>}

      <table className="tabela">
        <thead>
          <tr>
            <th>Pseudônimo</th>
            <th>Modo</th>
            <th>Etapa atual</th>
            <th>Início</th>
            <th>Conclusão</th>
            <th>Tempo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id} className={p.descartado ? "linha--descartada" : undefined}>
              <td>
                <code>{pseudonimoCurto(p.id)}</code>
                {p.descartado && " · descartado"}
              </td>
              <td>{p.modo === "piloto" ? "piloto" : "produção"}</td>
              <td>{ROTULO_ETAPA[p.etapa_atual] ?? p.etapa_atual}</td>
              <td>{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
              <td>
                {p.concluido_em
                  ? new Date(p.concluido_em).toLocaleDateString("pt-BR")
                  : "—"}
              </td>
              <td>{tempoTotal(p.criado_em, p.concluido_em) ?? "—"}</td>
              <td className="tabela__acoes">
                {p.modo === "producao" && (
                  <button
                    type="button"
                    className="link-acao"
                    disabled={ocupado === p.id}
                    onClick={async () => {
                      setOcupado(p.id);
                      const r = await reenviarConvite(p.invite_id);
                      setOcupado(null);
                      if (!r.ok) setErro(r.motivo);
                    }}
                  >
                    reenviar convite
                  </button>
                )}
                <button
                  type="button"
                  className="link-acao link-acao--perigo"
                  onClick={async () => {
                    const nota = p.descartado
                      ? null
                      : prompt("Motivo do descarte (opcional):") ?? "";
                    const { error } = await definirDescarte(
                      p.id,
                      !p.descartado,
                      nota,
                    );
                    if (error) setErro(error);
                    else if (estudo) recarregar(estudo.id);
                  }}
                >
                  {p.descartado ? "restaurar" : "descartar"}
                </button>
              </td>
            </tr>
          ))}
          {lista.length === 0 && (
            <tr>
              <td colSpan={7}>Nenhum participante ainda.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
