import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { recusarConvite, type ResultadoRecusa } from "../../lib/recusaConvite";
import { useTituloAba } from "../../lib/useTituloAba";

/**
 * Rota /participar/recusar/:token — o convidado clicou "Não tenho interesse" no
 * e-mail. Registra a recusa ao montar (POST via JS, não efeito de GET: robusto
 * ao pré-fetch de link que alguns clientes de e-mail / antivírus fazem).
 */
export function RecusarConvite() {
  useTituloAba("Convite");
  const { token = "" } = useParams();
  const [estado, setEstado] = useState<ResultadoRecusa | "carregando">(
    "carregando",
  );
  const jaRodou = useRef(false);

  function registrar() {
    setEstado("carregando");
    recusarConvite(token).then(setEstado);
  }

  useEffect(() => {
    if (jaRodou.current) return;
    jaRodou.current = true;
    registrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (estado === "carregando") {
    return <p role="status">Registrando sua resposta…</p>;
  }

  if (estado.ok) {
    return (
      <div className="cartao">
        <div className="tela-titulo">
          <span className="eyebrow">Convite</span>
          <h1>Registramos que você não deseja participar</h1>
          <hr className="regua" />
        </div>
        <p>
          Você não receberá novos contatos sobre esta pesquisa. Nenhuma outra
          ação é necessária.
        </p>
        <p>
          Se isso foi um engano, ou se você mudar de ideia, entre em contato com
          a equipe de pesquisa respondendo ao e-mail do convite.
        </p>
      </div>
    );
  }

  if (estado.motivo === "ja_concluido") {
    return (
      <div className="cartao">
        <div className="tela-titulo">
          <span className="eyebrow">Convite</span>
          <h1>Sua participação já foi concluída</h1>
          <hr className="regua" />
        </div>
        <p>
          As respostas vinculadas a este convite já foram concluídas — não há o
          que recusar. Agradecemos pela sua participação.
        </p>
      </div>
    );
  }

  if (estado.motivo === "token_invalido") {
    return (
      <div className="cartao">
        <div className="tela-titulo">
          <span className="eyebrow">Convite</span>
          <h1>Link não reconhecido</h1>
          <hr className="regua" />
        </div>
        <p>
          Este link não foi reconhecido. Verifique se copiou o endereço completo
          enviado a você.
        </p>
      </div>
    );
  }

  return (
    <div className="cartao">
      <div className="tela-titulo">
        <span className="eyebrow">Convite</span>
        <h1>Não foi possível registrar agora</h1>
        <hr className="regua" />
      </div>
      <p>Houve um problema de conexão. Tente novamente.</p>
      <button type="button" className="botao" onClick={registrar}>
        Tentar de novo
      </button>
    </div>
  );
}
