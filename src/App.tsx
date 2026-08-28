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
import { Landing } from "./routes/Landing";
import { NaoEncontrado } from "./routes/NaoEncontrado";

/**
 * Roteamento com HashRouter (GitHub Pages, sem configuração de servidor).
 *
 * Duas árvores completamente separadas:
 *  - /participar/*  → participantes da pesquisa (sem conta, só link com token)
 *  - /admin/*       → equipe de pesquisa (Supabase Auth)
 *
 * Um participante nunca vê /admin; a equipe nunca passa pelo fluxo de /participar.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* ---------- Participantes ---------- */}
        <Route path="/participar" element={<ParticipanteLayout />}>
          <Route index element={<NaoEncontrado contexto="participar" />} />
          <Route path=":token" element={<EntrarComToken />} />
          <Route path="etapa/:etapa" element={<EtapaPlaceholder />} />
          <Route path="encerramento" element={<Encerramento />} />
          <Route path="desconforto" element={<PaginaDesconforto />} />
        </Route>

        {/* ---------- Equipe de pesquisa ---------- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="login" element={<AdminLogin />} />
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
