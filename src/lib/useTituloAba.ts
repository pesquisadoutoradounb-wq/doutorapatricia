import { useEffect } from "react";

const SUFIXO = "Plataforma de Pesquisa";

/** Define o título da aba do navegador para a tela atual. */
export function useTituloAba(titulo: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${SUFIXO}` : SUFIXO;
    return () => {
      document.title = SUFIXO;
    };
  }, [titulo]);
}
