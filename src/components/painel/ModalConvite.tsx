import { useEffect, useMemo, useRef, useState } from "react";
import { EMAIL_RE, type LinhaConvite } from "../../lib/csvConvites";
import type { ResultadoEnvio } from "../../lib/convitesAdmin";

interface LinhaForm {
  email: string;
  nome: string;
}

const linhaVazia = (): LinhaForm => ({ email: "", nome: "" });

export type RetornoCadastro =
  | { ok: true; resultado: ResultadoEnvio }
  | { ok: false; motivo: string };

/**
 * Modal de cadastro de convites. Formulário estruturado (e-mail + nome), uma ou
 * várias linhas. Pode abrir já preenchido (importação de CSV). Fecha e recarrega
 * a lista quando todos os convites entram; se houver falha parcial, continua
 * aberto mostrando quais e-mails falharam.
 */
export function ModalConvite({
  aberto,
  linhasIniciais,
  onFechar,
  onCadastrar,
}: {
  aberto: boolean;
  /** pré-preenchimento (ex.: CSV importado) */
  linhasIniciais?: LinhaConvite[];
  onFechar: (recarregar: boolean) => void;
  onCadastrar: (linhas: LinhaConvite[]) => Promise<RetornoCadastro>;
}) {
  const [linhas, setLinhas] = useState<LinhaForm[]>([linhaVazia()]);
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aberto) return;
    setLinhas(
      linhasIniciais && linhasIniciais.length > 0
        ? linhasIniciais.map((l) => ({ email: l.email, nome: l.nome ?? "" }))
        : [linhaVazia()],
    );
    setResultado(null);
    setErroGeral(null);
    const t = setTimeout(() => primeiroCampo.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [aberto, linhasIniciais]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enviando) onFechar(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, enviando, onFechar]);

  const validacao = useMemo(() => {
    const vistos = new Set<string>();
    return linhas.map((l): "ok" | "vazio" | "invalido" | "repetido" => {
      const e = l.email.trim().toLowerCase();
      if (!e) return "vazio";
      if (!EMAIL_RE.test(e)) return "invalido";
      if (vistos.has(e)) return "repetido";
      vistos.add(e);
      return "ok";
    });
  }, [linhas]);

  const validas = validacao.filter((v) => v === "ok").length;
  const temProblema = validacao.some((v) => v === "invalido" || v === "repetido");
  const podeEnviar = validas > 0 && !temProblema && !enviando;

  function atualizar(i: number, campo: keyof LinhaForm, valor: string) {
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));
  }
  function adicionar() {
    setLinhas((ls) => [...ls, linhaVazia()]);
  }
  function remover(i: number) {
    setLinhas((ls) => (ls.length === 1 ? ls : ls.filter((_, j) => j !== i)));
  }

  async function enviar() {
    const payload: LinhaConvite[] = [];
    const vistos = new Set<string>();
    for (const l of linhas) {
      const email = l.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email) || vistos.has(email)) continue;
      vistos.add(email);
      payload.push({ email, nome: l.nome.trim() || null });
    }
    if (payload.length === 0) return;

    setEnviando(true);
    setErroGeral(null);
    setResultado(null);
    const r = await onCadastrar(payload);
    setEnviando(false);
    if (!r.ok) {
      setErroGeral(r.motivo);
      return;
    }
    setResultado(r.resultado);
    if (r.resultado.erros.length === 0) onFechar(true);
  }

  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={() => !enviando && onFechar(false)}>
      <div
        className="modal-cartao modal-cartao--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-convite-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-convite-titulo">Cadastrar convites</h2>
        <p className="modal-cartao__nota">
          Um convite por linha. O e-mail transacional é enviado no cadastro; o
          nome é opcional e aparece na saudação.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (podeEnviar) enviar();
          }}
        >
          <div className="modal-form-linhas">
            {linhas.map((l, i) => {
              const v = validacao[i];
              return (
                <div className="modal-form-linha" key={i}>
                  <label className="campo modal-form-campo">
                    <span className="campo__rotulo">
                      E-mail{i === 0 && <span aria-hidden> *</span>}
                    </span>
                    <input
                      ref={i === 0 ? primeiroCampo : undefined}
                      type="email"
                      value={l.email}
                      autoComplete="off"
                      aria-invalid={v === "invalido" || v === "repetido"}
                      onChange={(e) => atualizar(i, "email", e.target.value)}
                      placeholder="maria@exemplo.com"
                    />
                    {v === "invalido" && (
                      <span className="campo__erro">E-mail inválido.</span>
                    )}
                    {v === "repetido" && (
                      <span className="campo__erro">E-mail repetido nesta lista.</span>
                    )}
                  </label>
                  <label className="campo modal-form-campo">
                    <span className="campo__rotulo">Nome</span>
                    <input
                      type="text"
                      value={l.nome}
                      autoComplete="off"
                      onChange={(e) => atualizar(i, "nome", e.target.value)}
                      placeholder="opcional"
                    />
                  </label>
                  <button
                    type="button"
                    className="modal-form-linha__remover"
                    aria-label={`Remover linha ${i + 1}`}
                    disabled={linhas.length === 1 || enviando}
                    onClick={() => remover(i)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="link-acao"
            onClick={adicionar}
            disabled={enviando}
          >
            + Adicionar outro convidado
          </button>

          {erroGeral && <p className="erro-caixa">{erroGeral}</p>}
          {resultado && resultado.erros.length > 0 && (
            <div className="erro-caixa">
              <p>
                {resultado.criados} criado(s), {resultado.enviados} enviado(s).
                Falharam:
              </p>
              <ul>
                {resultado.erros.map((x) => (
                  <li key={x.email}>
                    {x.email} — {x.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-cartao__acoes">
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => onFechar(Boolean(resultado))}
              disabled={enviando}
            >
              {resultado ? "Fechar" : "Cancelar"}
            </button>
            <button type="submit" className="botao" disabled={!podeEnviar}>
              {enviando
                ? "Cadastrando…"
                : `Cadastrar ${validas > 0 ? `${validas} ` : ""}convite(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
