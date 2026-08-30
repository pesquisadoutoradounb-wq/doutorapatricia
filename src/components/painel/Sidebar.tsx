import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { listarEstudos, type Estudo } from "../../lib/estudos";
import { perfilAdminAtual, sairAdmin, type PerfilAdmin } from "../../lib/adminAuth";
import {
  IconePainel,
  IconeConvites,
  IconeParticipantes,
  IconeDocumentos,
  IconeAudios,
  IconeResultados,
  IconeExportar,
  IconeEstudos,
  IconeEquipe,
  IconeSair,
} from "./icones-painel";

const SECOES: { to: string; rotulo: string; fim?: boolean; icone: ReactNode }[] = [
  { to: "", rotulo: "Painel", fim: true, icone: <IconePainel /> },
  { to: "convites", rotulo: "Convites", icone: <IconeConvites /> },
  { to: "participantes", rotulo: "Participantes", icone: <IconeParticipantes /> },
  { to: "documentos", rotulo: "Documentos", icone: <IconeDocumentos /> },
  { to: "audios", rotulo: "Áudios", icone: <IconeAudios /> },
  { to: "resultados", rotulo: "Resultados", icone: <IconeResultados /> },
  { to: "exportar", rotulo: "Exportar", icone: <IconeExportar /> },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { studyId } = useParams();
  const [estudos, setEstudos] = useState<Estudo[]>([]);
  const [perfil, setPerfil] = useState<PerfilAdmin | null>(null);

  useEffect(() => {
    listarEstudos().then(setEstudos);
    perfilAdminAtual().then(setPerfil);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        Plataforma de Pesquisa
        <span>{perfil ? `${perfil.nome ?? "Equipe"} · ${perfil.papel}` : ""}</span>
      </div>

      <label className="sidebar__seletor">
        <span className="sidebar__rotulo">Estudo ativo</span>
        <select
          value={studyId ?? ""}
          onChange={(e) => navigate(`/painel/estudos/${e.target.value}`)}
        >
          <option value="" disabled>
            Selecione um estudo
          </option>
          {estudos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </label>

      {studyId && (
        <div className="sidebar__grupo">
          <span className="sidebar__grupo-rotulo">Estudo</span>
          <nav className="sidebar__nav">
            {SECOES.map((s) => (
              <NavLink
                key={s.to}
                end={s.fim}
                to={`/painel/estudos/${studyId}/${s.to}`.replace(/\/$/, "")}
                className={({ isActive }) =>
                  "sidebar__link" + (isActive ? " sidebar__link--ativo" : "")
                }
              >
                {s.icone}
                {s.rotulo}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <div className="sidebar__rodape">
        <span className="sidebar__grupo-rotulo">Plataforma</span>
        <NavLink
          to="/painel/estudos"
          className={({ isActive }) =>
            "sidebar__link" + (isActive ? " sidebar__link--ativo" : "")
          }
          end
        >
          <IconeEstudos />
          Todos os estudos
        </NavLink>
        <NavLink
          to="/painel/equipe"
          className={({ isActive }) =>
            "sidebar__link" + (isActive ? " sidebar__link--ativo" : "")
          }
        >
          <IconeEquipe />
          Equipe
        </NavLink>
        <button
          type="button"
          className="sidebar__link sidebar__sair"
          onClick={async () => {
            await sairAdmin();
            navigate("/", { replace: true });
          }}
        >
          <IconeSair />
          Sair
        </button>
      </div>
    </aside>
  );
}
