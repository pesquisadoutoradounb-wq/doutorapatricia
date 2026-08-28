import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { perfilAdminAtual, sairAdmin, type PerfilAdmin } from "../../lib/adminAuth";

/**
 * Shell do painel. Sub-projeto E implementa: gestão de convites, dashboard de
 * status, exportações, toggle piloto/produção.
 */
export function AdminHome() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilAdmin | null>(null);

  useEffect(() => {
    perfilAdminAtual().then(setPerfil);
  }, []);

  return (
    <div className="cartao">
      <h1>Painel da pesquisa</h1>
      {perfil && (
        <p>
          {perfil.nome ?? "Usuário"} — papel: <strong>{perfil.papel}</strong>
        </p>
      )}
      <div className="aviso">
        Estrutura pronta. Gestão de convites, dashboard de status/taxa de
        resposta e exportações entram no sub-projeto E.
      </div>
      <p style={{ marginTop: "var(--espaco-6)" }}>
        <button
          type="button"
          className="botao botao--secundario"
          onClick={async () => {
            await sairAdmin();
            navigate("/admin/login", { replace: true });
          }}
        >
          Sair
        </button>
      </p>
    </div>
  );
}
