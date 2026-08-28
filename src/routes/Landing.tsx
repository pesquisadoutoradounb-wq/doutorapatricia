import { config } from "../lib/config";

/**
 * Página raiz. Não é o convite. Quem chega aqui sem token não é participante
 * ainda — mostramos apenas uma orientação mínima e o acesso da equipe.
 */
export function Landing() {
  return (
    <div className="pagina">
      <main className="pagina__conteudo">
        <div className="cartao">
          <h1>{config.estudo.titulo}</h1>
          <p>{config.instituicao.nome} — {config.instituicao.programa}</p>
          <p>
            A participação nesta pesquisa acontece apenas por meio de um link de
            convite individual. Se você recebeu um convite, abra o link enviado a
            você.
          </p>
          <p className="documento__versao">
            Equipe de pesquisa: <a href="#/admin/login">acesso ao painel</a>
          </p>
        </div>
      </main>
    </div>
  );
}
