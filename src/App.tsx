import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ParticipanteLayout } from "./components/ParticipanteLayout";
import { EntrarComToken } from "./routes/participar/EntrarComToken";
import { EtapaPlaceholder } from "./routes/participar/EtapaPlaceholder";
import { Encerramento } from "./routes/participar/Encerramento";
import { PaginaDesconforto } from "./routes/participar/PaginaDesconforto";
import { AdminLayout } from "./components/AdminLayout";
import { AdminLogin } from "./routes/admin/AdminLogin";
import { AdminHome } from "./routes/admin/AdminHome";
import { RequireAdmin } from "./routes/admin/RequireAdmin";
import { NaoEncontrado } from "./routes/NaoEncontrado";

/**
 * Roteamento com HashRouter (GitHub Pages, sem configuração de servidor).
 *
 * A plataforma é da equipe de pesquisa: a raiz "/" É o login da equipe.
 * Os participantes nunca passam por aqui — cada um recebe um link dedicado
 * "/participar/:token" que retoma a pesquisa de onde parou e alimenta os
 * dados que a equipe consulta no painel.
 *
 * Duas árvores completamente separadas:
 *  - /participar/*  → participantes (sem conta, só link com token)
 *  - / e /admin/*   → equipe de pesquisa (Supabase Auth)
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Raiz = login da equipe (redireciona ao painel se já autenticado). */}
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin/login" element={<Navigate to="/" replace />} />

        {/* ---------- Participantes ---------- */}
        <Route path="/participar" element={<ParticipanteLayout />}>
          <Route index element={<NaoEncontrado contexto="participar" />} />
          <Route path=":token" element={<EntrarComToken />} />
          <Route path="etapa/:etapa" element={<EtapaPlaceholder />} />
          <Route path="encerramento" element={<Encerramento />} />
          <Route path="desconforto" element={<PaginaDesconforto />} />
        </Route>

        {/* ---------- Painel da equipe ---------- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <RequireAdmin>
                <AdminHome />
              </RequireAdmin>
            }
          />
        </Route>

        <Route path="/404" element={<NaoEncontrado />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </HashRouter>
  );
}
