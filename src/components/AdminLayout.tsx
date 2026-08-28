import { Outlet } from "react-router-dom";
import { config } from "../lib/config";

/**
 * Casca do painel administrativo. Visual e linguagem distintos do fluxo do
 * participante para tornar óbvio que são públicos e bancos de dados diferentes.
 */
export function AdminLayout() {
  return (
    <div className="pagina pagina--admin">
      <header className="cabecalho-admin">
        <strong>Painel da equipe de pesquisa</strong>
        <span className="cabecalho-admin__estudo">{config.estudo.titulo}</span>
      </header>
      <main className="pagina__conteudo">
        <Outlet />
      </main>
    </div>
  );
}
