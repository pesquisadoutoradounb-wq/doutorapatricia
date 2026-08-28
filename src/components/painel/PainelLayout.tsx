import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { RequireAdmin } from "../../routes/admin/RequireAdmin";
import { useTituloAba } from "../../lib/useTituloAba";

/**
 * Casca do painel da equipe — layout tipo ERP: sidebar fixa à esquerda com o
 * seletor de estudo e a navegação; conteúdo à direita. Distinto do fluxo do
 * participante (que não tem navegação livre).
 */
export function PainelLayout() {
  useTituloAba("Painel");
  return (
    <RequireAdmin>
      <div className="painel">
        <Sidebar />
        <main className="painel__conteudo">
          <Outlet />
        </main>
      </div>
    </RequireAdmin>
  );
}
