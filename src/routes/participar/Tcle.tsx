import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentoRenderizado } from "../../components/DocumentoRenderizado";
import { ExigeParticipante } from "./ExigeParticipante";
import { avancarEtapa, rotaDaEtapa } from "../../lib/participantSession";
import { useParticipante, type DadosParticipante } from "../../lib/participanteContexto";
import type { DocumentoEstudo } from "../../lib/documentos";
import {
  carregarOpcoesConsentimento,
  consentimentoExistente,
  registrarConsentimento,
  type OpcaoConsentimento,
} from "../../lib/consentimento";

export function Tcle() {
  return (
    <ExigeParticipante>{(p) => <TcleInterno p={p} />}</ExigeParticipante>
  );
}

function TcleInterno({ p }: { p: DadosParticipante }) {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();

  const [doc, setDoc] = useState<DocumentoEstudo | null>(null);
  const [opcoes, setOpcoes] = useState<OpcaoConsentimento[]>([]);
  const [decisaoExistente, setDecisaoExistente] = useState<
    "aceitou" | "recusou" | null | undefined
  >(undefined);
  const [escolha, setEscolha] = useState<"aceitou" | "recusou" | "">("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarOpcoesConsentimento(p.studyId).then(setOpcoes);
    consentimentoExistente(p.id).then((c) => setDecisaoExistente(c?.decisao ?? null));
  }, [p.studyId, p.id]);

  async function registrar() {
    if (!escolha || !doc) return;
    setErro(null);
    setEnviando(true);
    const { error } = await registrarConsentimento({
      participantId: p.id,
      decisao: escolha,
      tcleVersao: doc.versao,
      tcleTextoSnapshot: doc.corpo_html,
    });
    if (error) {
      setErro("Não foi possível registrar sua decisão. Tente novamente.");
      setEnviando(false);
      return;
    }
    if (escolha === "aceitou") {
      await avancarEtapa(p.id, "sociodemografico");
      await recarregar();
    }
    setDecisaoExistente(escolha);
    setEnviando(false);
  }

  if (decisaoExistente === undefined) return <p role="status">Carregando…</p>;

  if (decisaoExistente === "recusou") {
    return (
      <div className="cartao">
        <div className="tela-titulo">
          <span className="eyebrow">Consentimento</span>
          <h1>Participação não iniciada</h1>
          <hr className="regua" />
        </div>
        <p>
          Você indicou que não concorda em participar. Agradecemos pelo seu
          tempo. Nenhuma resposta será coletada.
        </p>
      </div>
    );
  }

  if (decisaoExistente === "aceitou") {
    return (
      <div className="cartao">
        <div className="tela-titulo">
          <span className="eyebrow">Consentimento</span>
          <h1>Consentimento registrado</h1>
          <hr className="regua" />
        </div>
        <p className="sucesso-caixa">
          Sua concordância foi registrada. Você pode salvar uma via do documento.
        </p>
        <div style={{ display: "flex", gap: "var(--espaco-3)", flexWrap: "wrap", marginTop: "var(--espaco-6)" }}>
          <a className="botao botao--secundario" href="#/participar/tcle/via" target="_blank" rel="noopener">
            Salvar via do TCLE (PDF)
          </a>
          <button
            type="button"
            className="botao"
            onClick={() => navigate(rotaDaEtapa("sociodemografico"), { replace: true })}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DocumentoRenderizado
        slug="tcle"
        studyId={p.studyId}
        fallbackTitulo="Termo de Consentimento Livre e Esclarecido"
        onCarregado={setDoc}
      />

      <div className="cartao" style={{ marginTop: "var(--espaco-6)" }}>
        <h2>Decisão eletrônica</h2>
        <fieldset className="consent-opcoes">
          <legend className="visualmente-oculto">Sua decisão sobre o TCLE</legend>
          {opcoes.map((o) => (
            <label key={o.valor} className="consent-opcao">
              <input
                type="radio"
                name="decisao-tcle"
                value={o.valor}
                checked={escolha === o.valor}
                onChange={() => setEscolha(o.valor)}
              />
              <span>{o.texto}</span>
            </label>
          ))}
        </fieldset>

        {erro && <p className="erro-caixa">{erro}</p>}

        <button
          type="button"
          className="botao"
          disabled={!escolha || !doc || enviando}
          onClick={registrar}
        >
          {enviando ? "Registrando…" : "Registrar decisão"}
        </button>
      </div>
    </div>
  );
}
