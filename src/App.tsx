import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ParticipanteLayout } from "./components/ParticipanteLayout";
import { EntrarComToken } from "./routes/participar/EntrarComToken";
import { Informacoes } from "./routes/participar/Informacoes";
import { Tcle } from "./routes/participar/Tcle";
import { ViaTcle } from "./routes/participar/ViaTcle";
import { EtapaPlaceholder } from "./routes/participar/EtapaPlaceholder";
import { Encerramento } from "./routes/participar/Encerramento";
import { PaginaDesconforto } from "./routes/participar/PaginaDesconforto";
import { AdminLogin } from "./routes/admin/AdminLogin";
import { PainelLayout } from "./components/painel/PainelLayout";
import { ListaEstudos } from "./routes/painel/ListaEstudos";
import { EstudoLayout } from "./routes/painel/EstudoLayout";
import { DashboardEstudo, Convites, Participantes, Exportar } from "./routes/painel/telas";
import { Documentos } from "./routes/painel/Documentos";
import { Equipe } from "./routes/painel/Equipe";
import { NaoEncontrado } from "./routes/NaoEncontrado";

/**
 * Roteamento com HashRouter (GitHub Pages).
 *
 * A plataforma é da equipe de pesquisa: a raiz "/" é o login; "/painel/*" é o
 * ERP (sidebar, seletor de estudo). Participantes nunca passam por aqui —
 * cada um recebe "/participar/:token" e retoma de onde parou.
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin/login" element={<Navigate to="/" replace />} />

        {/* ---------- Painel da equipe (ERP) ---------- */}
        <Route path="/painel" element={<PainelLayout />}>
          <Route index element={<Navigate to="/painel/estudos" replace />} />
          <Route path="estudos" element={<ListaEstudos />} />
          <Route path="equipe" element={<Equipe />} />
          <Route path="estudos/:studyId" element={<EstudoLayout />}>
            <Route index element={<DashboardEstudo />} />
            <Route path="convites" element={<Convites />} />
            <Route path="participantes" element={<Participantes />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="exportar" element={<Exportar />} />
          </Route>
        </Route>

        {/* ---------- Participantes ---------- */}
        <Route path="/participar" element={<ParticipanteLayout />}>
          <Route index element={<NaoEncontrado contexto="participar" />} />
          <Route path=":token" element={<EntrarComToken />} />
          <Route path="informacoes" element={<Informacoes />} />
          <Route path="tcle" element={<Tcle />} />
          <Route path="tcle/via" element={<ViaTcle />} />
          <Route path="etapa/:etapa" element={<EtapaPlaceholder />} />
          <Route path="encerramento" element={<Encerramento />} />
          <Route path="desconforto" element={<PaginaDesconforto />} />
        </Route>

        <Route path="/404" element={<NaoEncontrado />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </HashRouter>
  );
}
