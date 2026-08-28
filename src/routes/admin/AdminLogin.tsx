import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { entrarAdmin, perfilAdminAtual } from "../../lib/adminAuth";
import { supabase } from "../../lib/supabase";
import { config } from "../../lib/config";
import { IconeEmail, IconeSenha, IconeInstituicao } from "../../components/icones";

type Modo = "entrar" | "recuperar";

export function AdminLogin() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    perfilAdminAtual().then((p) => {
      if (p) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    const { error } = await entrarAdmin(email.trim(), senha);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setEnviando(false);
      return;
    }
    const perfil = await perfilAdminAtual();
    if (!perfil) {
      await supabase.auth.signOut();
      setErro("Esta conta não tem acesso ao painel da pesquisa.");
      setEnviando(false);
      return;
    }
    navigate("/admin", { replace: true });
  }

  async function recuperar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${config.appBaseUrl}/#/`,
    });
    setEnviando(false);
    // Mensagem genérica — não revela se a conta existe.
    setAviso(
      "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.",
    );
  }

  return (
    <div className="login-tela">
      <div className="login-malha" aria-hidden="true" />

      <div className="login-cartao">
        <div className="login-medalhao" aria-hidden="true">
          <IconeInstituicao />
        </div>

        <div className="tela-titulo">
          <span className="eyebrow">Painel da pesquisa</span>
          <h1>{modo === "entrar" ? "Acesso da equipe" : "Redefinir senha"}</h1>
          <hr className="regua" />
        </div>

        {modo === "entrar" ? (
          <form onSubmit={entrar} noValidate>
            <label className="campo">
              <span className="campo__rotulo">E-mail</span>
              <span className="campo__wrap">
                <IconeEmail />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                />
              </span>
            </label>

            <label className="campo">
              <span className="campo__rotulo">Senha</span>
              <span className="campo__wrap">
                <IconeSenha />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(ev) => setSenha(ev.target.value)}
                />
              </span>
            </label>

            <p className="login-linha-secundaria">
              <button type="button" onClick={() => { setModo("recuperar"); setErro(null); setAviso(null); }}>
                Esqueci minha senha
              </button>
            </p>

            {erro && <p className="erro-caixa">{erro}</p>}
            {aviso && <p className="sucesso-caixa">{aviso}</p>}

            <button type="submit" className="botao botao--bloco" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={recuperar} noValidate>
            <label className="campo">
              <span className="campo__rotulo">E-mail</span>
              <span className="campo__wrap">
                <IconeEmail />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                />
              </span>
            </label>

            <p className="login-linha-secundaria">
              <button type="button" onClick={() => { setModo("entrar"); setErro(null); setAviso(null); }}>
                Voltar ao login
              </button>
            </p>

            {aviso && <p className="sucesso-caixa">{aviso}</p>}

            <button type="submit" className="botao botao--bloco" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <p className="login-nota">
          Este acesso é da equipe de pesquisa. Se você foi convidado(a) a
          participar do estudo, use o link enviado no seu convite.
        </p>
      </div>
    </div>
  );
}
