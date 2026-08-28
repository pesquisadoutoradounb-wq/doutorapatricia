import { Link, Outlet, useLocation } from "react-router-dom";
import { StudyHeader } from "./StudyHeader";
import { ParticipanteProvider } from "../lib/participanteContexto";

/**
 * Casca das telas do participante.
 *
 * Sem sidebar: o fluxo é sequencial e não pode ser navegado livremente
 * (protocolo). Rodapé fixo com o link "Desconforto durante a pesquisa",
 * acessível de qualquer tela (requisito do protocolo ético).
 */
export function ParticipanteLayout() {
  const { pathname } = useLocation();
  const naPaginaDesconforto = pathname.endsWith("/desconforto");

  return (
    <ParticipanteProvider>
      <div className="pagina">
        <a className="pular-link" href="#conteudo-principal">
          Pular para o conteúdo
        </a>
        <StudyHeader />

        <main id="conteudo-principal" className="pagina__conteudo">
          <Outlet />
        </main>

        {!naPaginaDesconforto && (
          <footer className="rodape-desconforto">
            <Link to="/participar/desconforto">
              Sentindo desconforto durante a pesquisa? Clique aqui.
            </Link>
            <span className="rodape-desconforto__nota">
              Sua participação pode ser interrompida a qualquer momento, sem
              penalidade.
            </span>
          </footer>
        )}
      </div>
    </ParticipanteProvider>
  );
}
