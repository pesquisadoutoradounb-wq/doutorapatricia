import { useEffect, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import { TabelaCartao } from "../../components/painel/TabelaCartao";
import { Selo, type TomSelo } from "../../components/painel/Selo";
import { ModalConvite } from "../../components/painel/ModalConvite";
import { parseCsvConvites, type LinhaConvite } from "../../lib/csvConvites";
import {
  criarConvites,
  excluirConvite,
  gerarLinkTeste,
  linkDoConvite,
  listarConvites,
  reenviarConvite,
  type ConviteAdmin,
  type ResultadoEnvio,
} from "../../lib/convitesAdmin";

const ROTULO_STATUS: Record<string, string> = {
  enviado: "Enviado",
  aberto: "Acessou",
  iniciado: "Em andamento",
  concluido: "Concluído",
  expirado: "Expirado",
  inelegivel: "Inelegível",
  interrompido: "Interrompeu",
  recusou: "Recusou",
};

const TOM_STATUS: Record<string, TomSelo> = {
  enviado: "info",
  aberto: "info",
  iniciado: "info",
  concluido: "sucesso",
  expirado: "neutro",
  inelegivel: "erro",
  interrompido: "aviso",
  recusou: "neutro",
};

function data(s: string | null): string {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "—";
}

export function Convites() {
  const estudo = useEstudo();
  const [incluirPiloto, setIncluirPiloto] = useState(false);
  const [convites, setConvites] = useState<ConviteAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [linkTeste, setLinkTeste] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [linhasCsv, setLinhasCsv] = useState<LinhaConvite[] | undefined>();
  const [avisoCsv, setAvisoCsv] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResultadoEnvio | null>(null);

  async function recarregar(studyId: string) {
    setConvites(await listarConvites(studyId, { incluirPiloto }));
  }

  useEffect(() => {
    if (estudo) recarregar(estudo.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudo?.id, incluirPiloto]);

  function abrirCadastro() {
    setLinhasCsv(undefined);
    setAvisoCsv(null);
    setResumo(null);
    setModalAberto(true);
  }

  async function importarCsv(file: File) {
    const { linhas, erros } = parseCsvConvites(await file.text());
    if (linhas.length === 0) {
      setAvisoCsv("Nenhum e-mail válido encontrado no arquivo.");
      return;
    }
    setAvisoCsv(
      erros.length > 0
        ? `${erros.length} linha(s) do arquivo foram ignoradas por problema de formato.`
        : null,
    );
    setLinhasCsv(linhas);
    setResumo(null);
    setModalAberto(true);
  }

  function fecharModal(recarregarLista: boolean) {
    setModalAberto(false);
    setLinhasCsv(undefined);
    if (recarregarLista && estudo) recarregar(estudo.id);
  }

  return (
    <div>
      <CabecalhoTela sobretitulo={estudo?.nome ?? "Estudo"} titulo="Convites" />

      {!estudo || convites === null ? (
        <p role="status">Carregando…</p>
      ) : (
        <>
          <div className="pilha-cartoes">
            <section className="cartao-painel">
              <div className="cartao-painel__cabeca">
                <h2>Link de teste (piloto)</h2>
              </div>
              <div className="cartao-painel__corpo form-limite">
                <p className="documento__versao">
                  Gera um convite piloto para testar o fluxo do participante. Não
                  envia e-mail e não entra nas métricas de produção.
                </p>
                <button
                  type="button"
                  className="botao botao--secundario"
                  onClick={async () => {
                    if (!estudo) return;
                    const r = await gerarLinkTeste(estudo.id);
                    if (r.ok) {
                      setLinkTeste(r.link);
                      recarregar(estudo.id);
                    } else setErro(r.motivo);
                  }}
                >
                  Gerar link de teste
                </button>
                {linkTeste && (
                  <p className="sucesso-caixa" style={{ wordBreak: "break-all" }}>
                    {linkTeste}
                  </p>
                )}
              </div>
            </section>

            <section className="cartao-painel">
              <div className="cartao-painel__cabeca">
                <h2>Adicionar convites</h2>
              </div>
              <div className="cartao-painel__corpo form-limite">
                <p className="documento__versao">
                  Cada convite gera um link individual e dispara o e-mail
                  transacional. Cadastre um a um ou importe uma planilha
                  (<code>.csv</code> com colunas e-mail e nome).
                </p>

                <div className="painel-barra" style={{ marginTop: "var(--espaco-3)" }}>
                  <button type="button" className="botao" onClick={abrirCadastro}>
                    Cadastrar convite
                  </button>
                  <label className="botao botao--secundario" style={{ cursor: "pointer" }}>
                    Importar CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="visualmente-oculto"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) await importarCsv(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {avisoCsv && <p className="aviso">{avisoCsv}</p>}
                {resumo && (
                  <p className="sucesso-caixa">
                    {resumo.criados} criado(s), {resumo.enviados} enviado(s).
                  </p>
                )}
                {erro && <p className="erro-caixa">{erro}</p>}
              </div>
            </section>
          </div>

          <ModalConvite
            aberto={modalAberto}
            linhasIniciais={linhasCsv}
            onFechar={fecharModal}
            onCadastrar={async (linhas) => {
              if (!estudo) return { ok: false as const, motivo: "Estudo não carregado." };
              const r = await criarConvites(estudo.id, linhas);
              if (r.ok) setResumo(r.resultado);
              return r;
            }}
          />

          <TabelaCartao
            titulo="Convites"
            contagem={convites.length}
            acoes={
              <AlternadorModo
                incluirPiloto={incluirPiloto}
                onChange={setIncluirPiloto}
              />
            }
          >
            <table className="tabela">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Nome</th>
                  <th>Modo</th>
                  <th>Status</th>
                  <th>Entrega do e-mail</th>
                  <th className="num">Enviado</th>
                  <th className="num">Expira</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {convites.map((c) => (
                  <tr key={c.id}>
                    <td>{c.email}</td>
                    <td>{c.nome ?? "—"}</td>
                    <td>
                      <Selo tom={c.modo === "piloto" ? "aviso" : "neutro"}>
                        {c.modo === "piloto" ? "piloto" : "produção"}
                      </Selo>
                    </td>
                    <td>
                      <Selo tom={TOM_STATUS[c.status] ?? "neutro"}>
                        {ROTULO_STATUS[c.status] ?? c.status}
                      </Selo>
                      {!c.enviado_em && c.modo === "producao" && (
                        <>
                          {" "}
                          <Selo tom="aviso" ponto={false}>
                            não enviado
                          </Selo>
                        </>
                      )}
                    </td>
                    <td>
                      {c.email_aberto ? (
                        <Selo tom="info">abriu</Selo>
                      ) : c.email_entregue ? (
                        <Selo tom="neutro">entregue</Selo>
                      ) : c.modo === "piloto" ? (
                        "—"
                      ) : (
                        <Selo tom="aviso" ponto={false}>
                          sem registro
                        </Selo>
                      )}
                    </td>
                    <td className="num">{data(c.enviado_em)}</td>
                    <td className="num">{data(c.expira_em)}</td>
                    <td className="tabela__acoes">
                      <button
                        type="button"
                        className="link-acao"
                        onClick={() =>
                          navigator.clipboard?.writeText(linkDoConvite(c.token))
                        }
                      >
                        copiar link
                      </button>
                      {c.modo === "producao" && (
                        <button
                          type="button"
                          className="link-acao"
                          disabled={ocupadoId === c.id}
                          onClick={async () => {
                            setOcupadoId(c.id);
                            const r = await reenviarConvite(c.id);
                            setOcupadoId(null);
                            if (!r.ok) setErro(r.motivo);
                            else if (estudo) recarregar(estudo.id);
                          }}
                        >
                          reenviar
                        </button>
                      )}
                      <button
                        type="button"
                        className="link-acao link-acao--perigo"
                        onClick={async () => {
                          if (!confirm("Excluir este convite?")) return;
                          await excluirConvite(c.id);
                          if (estudo) recarregar(estudo.id);
                        }}
                      >
                        excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {convites.length === 0 && (
                  <tr>
                    <td className="tabela__vazio" colSpan={8}>
                      Nenhum convite ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TabelaCartao>
        </>
      )}
    </div>
  );
}
