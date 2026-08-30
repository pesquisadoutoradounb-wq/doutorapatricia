import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarEstudos, type Estudo } from "../../lib/estudos";
import { CabecalhoTela } from "../../components/painel/CabecalhoTela";
import { Selo } from "../../components/painel/Selo";

export function ListaEstudos() {
  const [estudos, setEstudos] = useState<Estudo[] | null>(null);

  useEffect(() => {
    listarEstudos().then(setEstudos);
  }, []);

  return (
    <div>
      <CabecalhoTela sobretitulo="Plataforma" titulo="Estudos" />

      {estudos === null ? (
        <p role="status">Carregando…</p>
      ) : (
        <div className="lista-cartoes">
          {estudos.map((e) => (
            <Link
              key={e.id}
              to={`/painel/estudos/${e.id}`}
              className="cartao cartao--link cartao-painel--acento"
            >
              <strong>{e.nome}</strong>
              {e.descricao && <p>{e.descricao}</p>}
              <span className="lista-cartoes__meta">
                <Selo tom={e.ativo ? "sucesso" : "neutro"}>
                  {e.ativo ? "ativo" : "inativo"}
                </Selo>
                <code>{e.slug}</code>
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
