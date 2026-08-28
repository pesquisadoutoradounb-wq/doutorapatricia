import { Outlet, useParams } from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import { estudoPorId, type Estudo } from "../../lib/estudos";

const EstudoCtx = createContext<Estudo | null>(null);
export const useEstudo = () => useContext(EstudoCtx);

/**
 * Layout de um estudo dentro do painel. Carrega o estudo por :studyId e o
 * disponibiliza às telas-filhas.
 */
export function EstudoLayout() {
  const { studyId = "" } = useParams();
  const [estudo, setEstudo] = useState<Estudo | null | undefined>(undefined);

  useEffect(() => {
    estudoPorId(studyId).then((e) => setEstudo(e));
  }, [studyId]);

  if (estudo === undefined) return <p role="status">Carregando estudo…</p>;
  if (estudo === null) {
    return (
      <div className="cartao">
        <h1>Estudo não encontrado</h1>
        <p>Selecione um estudo na barra lateral.</p>
      </div>
    );
  }

  return (
    <EstudoCtx.Provider value={estudo}>
      <Outlet />
    </EstudoCtx.Provider>
  );
}
