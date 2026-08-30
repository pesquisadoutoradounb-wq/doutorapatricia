import { useEffect, useMemo, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import { TabelaCartao } from "../../components/painel/TabelaCartao";
import { Selo, type TomSelo } from "../../components/painel/Selo";
import { parseCsvConvites } from "../../lib/csvConvites";
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
};

const TOM_STATUS: Record<string, TomSelo> = {
  enviado: "info",
  aberto: "info",
  iniciado: "info",
  concluido: "sucesso",
  expirado: "neutro",
  inelegivel: "erro",
  interrompido: "aviso",
};

function data(s: string | null): string {
  return s ? new Date(s).toLocaleDateString("pt-BR") : "—";
}

export function Convites() {
  const estudo = useEstudo();
  const [incluirPiloto, setIncluirPiloto] = useState(false);
  const [convites, setConvites] = useState<ConviteAdmin[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [linkTeste, setLinkTeste] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  async function recarregar(studyId: string) {
    setConvites(await listarConvites(studyId, { incluirPiloto }));
  }

  useEffect(() => {
    if (estudo) recarregar(estudo.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudo?.id, incluirPiloto]);

  const parsed = useMemo(() => parseCsvConvites(texto), [texto]);

  async function enviar() {
    if (!estudo || parsed.linhas.length === 0) return;
    setErro(null);
    setResultado(null);
    setEnviando(true);
    const r = await criarConvites(estudo.id, parsed.linhas);
    setEnviando(false);
    if (!r.ok) return setErro(r.motivo);
    setResultado(r.resultado);
    setTexto("");
    recarregar(estudo.id);
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
                  Um e-mail por linha, ou <code>email, nome</code> /{" "}
                  <code>email; nome</code>. Cabeçalho é ignorado.
                </p>
                <textarea
                  rows={6}
                  value={texto}
                  placeholder={"maria@exemplo.com, Maria\njoao@exemplo.com"}
                  onChange={(e) => setTexto(e.target.value)}
                />
                <label className="campo" style={{ marginTop: "var(--espaco-3)" }}>
                  <span className="campo__rotulo">Ou importe um arquivo .csv</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setTexto(await f.text());
                      e.target.value = "";
                    }}
                  />
                </label>

                {texto.trim() && (
                  <p className="documento__versao">
                    {parsed.linhas.length} e-mail(s) válido(s)
                    {parsed.erros.length > 0 &&
                      `, ${parsed.erros.length} com problema`}
                    .
                  </p>
                )}
                {parsed.erros.length > 0 && (
                  <ul className="erro-caixa">
                    {parsed.erros.slice(0, 8).map((e) => (
                      <li key={e.linha}>
                        Linha {e.linha}: {e.motivo}
                      </li>
                    ))}
                  </ul>
                )}

                {erro && <p className="erro-caixa">{erro}</p>}
                {resultado && (
                  <p className="sucesso-caixa">
                    {resultado.criados} criado(s), {resultado.enviados} enviado(s).
                    {resultado.erros.length > 0 &&
                      ` Falhas: ${resultado.erros.map((x) => x.email).join(", ")}.`}
                  </p>
                )}

                <button
                  type="button"
                  className="botao"
                  disabled={enviando || parsed.linhas.length === 0}
                  onClick={enviar}
                >
                  {enviando
                    ? "Cadastrando…"
                    : parsed.linhas.length > 0
                      ? `Cadastrar ${parsed.linhas.length} convite(s)`
                      : "Cadastrar convite(s)"}
                </button>
              </div>
            </section>
          </div>

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
                    <td className="tabela__vazio" colSpan={7}>
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
