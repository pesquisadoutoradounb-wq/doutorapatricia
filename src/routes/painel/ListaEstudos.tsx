import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarEstudos, type Estudo } from "../../lib/estudos";

export function ListaEstudos() {
  const [estudos, setEstudos] = useState<Estudo[] | null>(null);

  useEffect(() => {
    listarEstudos().then(setEstudos);
  }, []);

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">Plataforma</span>
        <h1>Estudos</h1>
        <hr className="regua" />
      </div>

      {estudos === null ? (
        <p role="status">Carregando…</p>
      ) : (
        <div className="lista-cartoes">
          {estudos.map((e) => (
            <Link key={e.id} to={`/painel/estudos/${e.id}`} className="cartao cartao--link">
              <strong>{e.nome}</strong>
              {e.descricao && <p>{e.descricao}</p>}
              <span className="documento__versao">
                {e.ativo ? "ativo" : "inativo"} · {e.slug}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="aviso" style={{ marginTop: "var(--espaco-6)" }}>
        Criar e configurar novos estudos entra no sub-projeto E. Hoje: Estudo 1.
      </div>
    </div>
  );
}
