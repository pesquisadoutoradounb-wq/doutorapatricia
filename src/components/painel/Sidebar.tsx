import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { listarEstudos, type Estudo } from "../../lib/estudos";
import { perfilAdminAtual, sairAdmin, type PerfilAdmin } from "../../lib/adminAuth";

const SECOES = [
  { to: "", rotulo: "Painel", fim: true },
  { to: "convites", rotulo: "Convites" },
  { to: "participantes", rotulo: "Participantes" },
  { to: "documentos", rotulo: "Documentos" },
  { to: "audios", rotulo: "Áudios" },
  { to: "exportar", rotulo: "Exportar" },
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
        <span className="visualmente-oculto">Estudo</span>
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
              {s.rotulo}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="sidebar__rodape">
        <NavLink
          to="/painel/estudos"
          className={({ isActive }) =>
            "sidebar__link" + (isActive ? " sidebar__link--ativo" : "")
          }
          end
        >
          Todos os estudos
        </NavLink>
        <NavLink
          to="/painel/equipe"
          className={({ isActive }) =>
            "sidebar__link" + (isActive ? " sidebar__link--ativo" : "")
          }
        >
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
          Sair
        </button>
      </div>
    </aside>
  );
}
