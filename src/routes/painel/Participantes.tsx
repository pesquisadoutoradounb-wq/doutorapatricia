import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import { TabelaCartao } from "../../components/painel/TabelaCartao";
import { Selo, type TomSelo } from "../../components/painel/Selo";
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

const TOM_ETAPA: Record<string, TomSelo> = {
  concluido: "sucesso",
  inelegivel: "erro",
  interrompido: "aviso",
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

  return (
    <div>
      <CabecalhoTela
        sobretitulo={estudo?.nome ?? "Estudo"}
        titulo="Participantes"
        acoes={
          <>
            <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
            <label className="alternador-modo">
              <input
                type="checkbox"
                checked={incluirDescartados}
                onChange={(e) => setIncluirDescartados(e.target.checked)}
              />
              <span>Mostrar descartados</span>
            </label>
          </>
        }
      >
        <p>
          Lista pseudônima — sem nome ou e-mail. Use a tela de Convites para os
          dados de contato.
        </p>
      </CabecalhoTela>

      {erro && <p className="erro-caixa">{erro}</p>}

      {!estudo || lista === null ? (
        <p role="status">Carregando…</p>
      ) : (
        <TabelaCartao titulo="Participantes" contagem={lista.length}>
          <table className="tabela">
            <thead>
              <tr>
                <th>Pseudônimo</th>
                <th>Modo</th>
                <th>Etapa atual</th>
                <th className="num">Início</th>
                <th className="num">Conclusão</th>
                <th className="num">Tempo</th>
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
                  <td>
                    <Selo tom={p.modo === "piloto" ? "aviso" : "neutro"}>
                      {p.modo === "piloto" ? "piloto" : "produção"}
                    </Selo>
                  </td>
                  <td>
                    <Selo tom={TOM_ETAPA[p.etapa_atual] ?? "info"}>
                      {ROTULO_ETAPA[p.etapa_atual] ?? p.etapa_atual}
                    </Selo>
                  </td>
                  <td className="num">
                    {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="num">
                    {p.concluido_em
                      ? new Date(p.concluido_em).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="num">{tempoTotal(p.criado_em, p.concluido_em) ?? "—"}</td>
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
                  <td className="tabela__vazio" colSpan={7}>
                    Nenhum participante ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TabelaCartao>
      )}
    </div>
  );
}
