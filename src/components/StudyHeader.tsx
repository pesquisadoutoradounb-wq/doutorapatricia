import { config } from "../lib/config";

/**
 * Cabeçalho do estudo. Lê `config.identidade` — trocável entre "neutra",
 * "unb" e "vivant" sem alterar o restante da aplicação (PERGUNTAR 25).
 *
 * Não exibe nenhum conteúdo de instrumento. Não exibe indicador de progresso
 * aqui — isso é responsabilidade de cada etapa, para não revelar quantas
 * situações envolvem cada domínio.
 */
export function StudyHeader() {
  return (
    <header className="cabecalho-estudo">
      <div className="cabecalho-estudo__marca">
        {config.identidade === "vivant" ? (
          <span className="cabecalho-estudo__logo">Vivant Psicologia</span>
        ) : (
          <span className="cabecalho-estudo__logo">{config.instituicao.nome}</span>
        )}
      </div>
      <p className="cabecalho-estudo__linha">
        {config.estudo.titulo}
        {config.identidade !== "unb" && (
          <span className="cabecalho-estudo__inst"> · {config.instituicao.nome}</span>
        )}
      </p>
      {config.studyMode === "piloto" && (
        <p className="cabecalho-estudo__piloto" role="status">
          Ambiente de teste (modo piloto)
        </p>
      )}
    </header>
  );
}
