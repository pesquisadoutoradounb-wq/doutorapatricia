import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { entrarAdmin, perfilAdminAtual } from "../../lib/adminAuth";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    perfilAdminAtual().then((p) => {
      if (p) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await entrarAdmin(email.trim(), senha);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      setEnviando(false);
      return;
    }
    const perfil = await perfilAdminAtual();
    if (!perfil) {
      setErro("Esta conta não tem acesso ao painel da pesquisa.");
      setEnviando(false);
      return;
    }
    navigate("/admin", { replace: true });
  }

  return (
    <div className="cartao" style={{ maxWidth: "22rem", margin: "0 auto" }}>
      <h1>Acesso da equipe</h1>
      <p className="documento__versao">
        Área restrita à equipe de pesquisa. Participantes não usam esta tela.
      </p>
      <form onSubmit={aoEnviar}>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <p className="erro-caixa">{erro}</p>}
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
