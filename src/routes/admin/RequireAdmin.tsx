import { type ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { perfilAdminAtual, type PerfilAdmin } from "../../lib/adminAuth";

/**
 * Portão de acesso do painel. Só deixa passar quem está autenticado E tem
 * linha em `research_admins`. Qualquer outro caso é redirecionado ao login.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<
    { fase: "checando" } | { fase: "ok"; perfil: PerfilAdmin } | { fase: "negado" }
  >({ fase: "checando" });

  useEffect(() => {
    let vivo = true;
    perfilAdminAtual().then((perfil) => {
      if (!vivo) return;
      setEstado(perfil ? { fase: "ok", perfil } : { fase: "negado" });
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (estado.fase === "checando") return <p role="status">Verificando acesso…</p>;
  if (estado.fase === "negado") return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
