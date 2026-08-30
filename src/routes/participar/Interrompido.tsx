/**
 * Tela terminal de desistência (PERGUNTAR 19). O participante escolheu, no modal
 * de abandono, cancelar a participação. Sóbria e sem culpa; o link não retoma
 * mais.
 */
export function Interrompido() {
  return (
    <div className="cartao">
      <div className="tela-titulo">
        <span className="eyebrow">Participação encerrada</span>
        <h1>Sua participação foi interrompida</h1>
        <hr className="regua" />
      </div>
      <p>
        Registramos sua decisão de não continuar. As respostas já enviadas serão
        tratadas conforme descrito no Termo de Consentimento Livre e Esclarecido.
      </p>
      <p>
        Agradecemos o tempo que você dedicou até aqui. Se mudar de ideia ou tiver
        dúvidas sobre a pesquisa, entre em contato com a equipe pelos canais
        informados no TCLE.
      </p>
    </div>
  );
}
