import { config } from "../lib/config";
import { useParticipante } from "../lib/participanteContexto";

/**
 * Cabeçalho do estudo (fluxo do participante). O nome do estudo vem da sessão;
 * a marca institucional vem de `config.identidade` (PERGUNTAR 25 — default
 * "neutra" com menção à UnB).
 */
export function StudyHeader() {
  const { estado } = useParticipante();
  const nomeEstudo =
    estado.fase === "ok" && estado.dados.studyNome ? estado.dados.studyNome : null;
  const modo = estado.fase === "ok" ? estado.dados.modo : null;

  const marca =
    config.identidade === "vivant" ? "Vivant Psicologia" : config.instituicao.nome;

  return (
    <header className="cabecalho-estudo">
      <span className="cabecalho-estudo__logo">{marca}</span>
      {nomeEstudo && <p className="cabecalho-estudo__linha">{nomeEstudo}</p>}
      {modo === "piloto" && (
        <p className="cabecalho-estudo__piloto" role="status">
          Ambiente de teste — modo piloto
        </p>
      )}
    </header>
  );
}
