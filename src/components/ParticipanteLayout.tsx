import { Link, Outlet, useLocation } from "react-router-dom";
import { StudyHeader } from "./StudyHeader";

/**
 * Casca das telas do participante.
 *
 * Rodapé fixo com o link "Desconforto durante a pesquisa", acessível a partir
 * de qualquer tela (requisito do protocolo ético). O link não aparece na
 * própria página de desconforto.
 */
export function ParticipanteLayout() {
  const { pathname } = useLocation();
  const naPaginaDesconforto = pathname.endsWith("/desconforto");

  return (
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
  );
}
