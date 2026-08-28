import { config } from "../lib/config";

/**
 * Cabeçalho do estudo. Lê `config.identidade` — trocável entre "neutra",
 * "unb" e "vivant" sem alterar o restante da aplicação (PERGUNTAR 25).
 *
 * Sem indicador de progresso aqui — isso é responsabilidade de cada etapa,
 * para não revelar quantas situações envolvem cada domínio.
 */
export function StudyHeader() {
  const marca =
    config.identidade === "vivant" ? "Vivant Psicologia" : config.instituicao.nome;

  return (
    <header className="cabecalho-estudo">
      <span className="cabecalho-estudo__logo">{marca}</span>
      <p className="cabecalho-estudo__linha">
        {config.estudo.titulo}
        {config.identidade === "vivant" && ` · ${config.instituicao.nome}`}
      </p>
      {config.studyMode === "piloto" && (
        <p className="cabecalho-estudo__piloto" role="status">
          Ambiente de teste — modo piloto
        </p>
      )}
    </header>
  );
}
