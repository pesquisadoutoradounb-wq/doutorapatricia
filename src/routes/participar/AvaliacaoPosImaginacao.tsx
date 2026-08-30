import { useMemo, useState } from "react";
import type { DadosParticipante } from "../../lib/participanteContexto";
import { useAutosave } from "../../hooks/useAutosave";
import { useVerificacaoAvanco } from "../../hooks/useVerificacaoAvanco";
import { ModalAbandono } from "../../components/participar/ModalAbandono";
import { EscalaNumerica } from "../../components/participar/EscalaNumerica";
import { MatrizEmocoes } from "../../components/participar/MatrizEmocoes";
import {
  AVALIACAO_POS_IMAGINACAO,
  INTRODUCAO_AVALIACAO,
  marcaBranco,
  normalizarRespostas,
  questaoVisivel,
  questoesAplicaveis,
  type CampoAvaliacao,
  type QuestaoAvaliacao,
  type RespostasAvaliacao,
  type ValorAvaliacao,
} from "../../lib/vinhetas/avaliacaoPosImaginacao";
import {
  concluirAvaliacaoVinheta,
  salvarParcialVinheta,
} from "../../lib/vinhetas/vinhetasFluxo";

const limpar = (r: RespostasAvaliacao): RespostasAvaliacao => {
  const saida: RespostasAvaliacao = {};
  for (const [k, v] of Object.entries(r)) {
    if (v !== undefined) saida[k as CampoAvaliacao] = v;
  }
  return saida;
};

export function AvaliacaoPosImaginacao({
  p,
  vignetteId,
  situacaoNumero,
  respostaInicial,
  onConcluida,
}: {
  p: DadosParticipante;
  vignetteId: number;
  situacaoNumero: number;
  respostaInicial: RespostasAvaliacao;
  onConcluida: () => void | Promise<void>;
}) {
  const autosave = useAutosave();
  const [respostas, setRespostas] = useState<RespostasAvaliacao>(respostaInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [concluindo, setConcluindo] = useState(false);

  const visiveis = useMemo(() => questoesAplicaveis(respostas), [respostas]);

  const verif = useVerificacaoAvanco(p.id, async () => {
    setConcluindo(true);
    const { error } = await concluirAvaliacaoVinheta(
      p.id,
      vignetteId,
      limpar(normalizarRespostas(respostas)),
    );
    if (error) {
      setConcluindo(false);
      setErro("Não foi possível salvar suas respostas. Verifique sua conexão.");
      return;
    }
    await onConcluida();
  });

  function aplicar(mut: (r: RespostasAvaliacao) => RespostasAvaliacao) {
    setRespostas((atual) => {
      const proximo = normalizarRespostas(mut({ ...atual }));
      autosave.agendar(() =>
        salvarParcialVinheta(p.id, vignetteId, limpar(proximo)),
      );
      return proximo;
    });
    verif.limparAviso();
  }

  const setCampo = (campo: CampoAvaliacao, valor: ValorAvaliacao) =>
    aplicar((r) => ({ ...r, [campo]: valor }));

  async function aoConcluir() {
    setErro(null);
    const ok = await autosave.flush();
    if (!ok) {
      setErro("Não foi possível salvar suas respostas. Verifique sua conexão.");
      return;
    }
    const marcas = visiveis.map((q) => marcaBranco(q, respostas[q.campo]));
    await verif.tentarAvancar(marcas);
  }

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">Situação {situacaoNumero} de 10 · avaliação</span>
        <h1>Sobre a sua experiência</h1>
        <hr className="regua" />
      </div>
      <p className="socio-introducao">{INTRODUCAO_AVALIACAO}</p>

      {AVALIACAO_POS_IMAGINACAO.filter((q) => questaoVisivel(q, respostas)).map(
        (q) => (
          <CampoAvaliacao
            key={q.campo}
            q={q}
            respostas={respostas}
            emBranco={verif.aviso && marcaBranco(q, respostas[q.campo]) === null}
            setCampo={setCampo}
          />
        ),
      )}

      {verif.aviso && (
        <p className="aviso" role="alert">
          Há questões sem resposta. Toque em “Concluir” novamente para seguir
          assim mesmo.
        </p>
      )}
      {erro && <p className="erro-caixa">{erro}</p>}

      <div style={{ marginTop: "var(--espaco-6)" }}>
        <button
          type="button"
          className="botao"
          disabled={concluindo}
          onClick={aoConcluir}
        >
          {concluindo ? "Salvando…" : "Concluir"}
        </button>
      </div>

      <ModalAbandono
        aberto={verif.modalAberto}
        confirmando={verif.confirmando}
        onCancelar={verif.cancelarAbandono}
        onConfirmar={verif.confirmarAbandono}
      />
      {verif.erroAbandono && <p className="erro-caixa">{verif.erroAbandono}</p>}
    </div>
  );
}

function CampoAvaliacao({
  q,
  respostas,
  emBranco,
  setCampo,
}: {
  q: QuestaoAvaliacao;
  respostas: RespostasAvaliacao;
  emBranco: boolean;
  setCampo: (campo: CampoAvaliacao, valor: ValorAvaliacao) => void;
}) {
  const valor = respostas[q.campo];
  const texto = (v: ValorAvaliacao) => (typeof v === "string" ? v : "");

  return (
    <div className={`socio-campo${emBranco ? " socio-campo--branco" : ""}`}>
      <span className="socio-campo__rotulo">
        {q.numero}. {q.enunciado}
      </span>
      {q.ajuda && <span className="socio-campo__ajuda">{q.ajuda}</span>}

      {q.tipo === "escala" && (
        <EscalaNumerica
          nome={q.campo}
          min={q.min ?? 0}
          max={q.max ?? 10}
          rotuloMin={q.rotuloMin}
          rotuloMax={q.rotuloMax}
          valor={typeof valor === "number" ? valor : null}
          onChange={(v) => setCampo(q.campo, v)}
          emBranco={emBranco}
        />
      )}

      {q.tipo === "matriz" && (
        <MatrizEmocoes
          nome={q.campo}
          linhas={q.linhas ?? []}
          comOutra={q.comOutra}
          valor={(valor as Record<string, never>) ?? null}
          onChange={(v) => setCampo(q.campo, v as ValorAvaliacao)}
        />
      )}

      {q.tipo === "texto" &&
        (q.longo ? (
          <textarea
            rows={3}
            value={texto(valor)}
            onChange={(e) => setCampo(q.campo, e.target.value)}
          />
        ) : (
          <input
            type="text"
            value={texto(valor)}
            onChange={(e) => setCampo(q.campo, e.target.value)}
          />
        ))}

      {q.tipo === "radio" && (
        <div className="socio-opcoes">
          {q.opcoes?.map((o) => (
            <label key={o.valor} className="socio-opcao">
              <input
                type="radio"
                name={q.campo}
                checked={valor === o.valor}
                onChange={() => setCampo(q.campo, o.valor)}
              />
              <span>{o.rotulo}</span>
            </label>
          ))}
        </div>
      )}

      {q.campo === "q2_emocao_categoria" && valor === "outra" && (
        <input
          type="text"
          placeholder="Qual?"
          value={texto(respostas.q2_emocao_outra)}
          onChange={(e) => setCampo("q2_emocao_outra", e.target.value)}
        />
      )}
      {q.campo === "q9_perspectiva" && valor === "outra" && (
        <input
          type="text"
          placeholder="Qual perspectiva?"
          value={texto(respostas.q9_perspectiva_outra)}
          onChange={(e) => setCampo("q9_perspectiva_outra", e.target.value)}
        />
      )}
    </div>
  );
}
