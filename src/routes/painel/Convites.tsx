import { useEffect, useMemo, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
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

  if (!estudo || convites === null) return <p role="status">Carregando…</p>;

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
      <div className="tela-titulo">
        <span className="eyebrow">{estudo.nome}</span>
        <h1>Convites</h1>
        <hr className="regua" />
      </div>

      <div className="cartao">
        <h2>Adicionar convites</h2>
        <p className="documento__versao">
          Um e-mail por linha, ou <code>email, nome</code> / <code>email; nome</code>.
          Cabeçalho é ignorado.
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
            {parsed.erros.length > 0 && `, ${parsed.erros.length} com problema`}.
          </p>
        )}
        {parsed.erros.length > 0 && (
          <ul className="erro-caixa">
            {parsed.erros.slice(0, 8).map((e) => (
              <li key={e.linha}>Linha {e.linha}: {e.motivo}</li>
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
          {enviando ? "Enviando…" : `Enviar ${parsed.linhas.length || ""} convite(s)`}
        </button>
      </div>

      <div className="cartao" style={{ marginTop: "var(--espaco-4)" }}>
        <h2>Link de teste (piloto)</h2>
        <p className="documento__versao">
          Gera um convite piloto para testar o fluxo do participante. Não envia
          e-mail e não entra nas métricas de produção.
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

      <div style={{ margin: "var(--espaco-6) 0 var(--espaco-3)" }}>
        <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
      </div>

      <table className="tabela">
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Nome</th>
            <th>Modo</th>
            <th>Status</th>
            <th>Enviado</th>
            <th>Expira</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {convites.map((c) => (
            <tr key={c.id}>
              <td>{c.email}</td>
              <td>{c.nome ?? "—"}</td>
              <td>{c.modo === "piloto" ? "piloto" : "produção"}</td>
              <td>
                {ROTULO_STATUS[c.status] ?? c.status}
                {!c.enviado_em && c.modo === "producao" && " (não enviado)"}
              </td>
              <td>{data(c.enviado_em)}</td>
              <td>{data(c.expira_em)}</td>
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
              <td colSpan={7}>Nenhum convite ainda.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
