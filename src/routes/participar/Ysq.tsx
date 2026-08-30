import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DadosParticipante } from "../../lib/participanteContexto";
import { useParticipante } from "../../lib/participanteContexto";
import { avancarEtapa, rotaDaEtapa } from "../../lib/participantSession";
import { useVerificacaoAvanco } from "../../hooks/useVerificacaoAvanco";
import { ModalAbandono } from "../../components/participar/ModalAbandono";
import { InstrucaoInstrumento } from "../../components/participar/InstrucaoInstrumento";
import {
  EscalaLikert,
  LegendaEscala,
} from "../../components/participar/EscalaLikert";
import { BlocoProgresso } from "../../components/participar/BlocoProgresso";
import {
  carregarEscala,
  carregarItensYsq,
  carregarRespostasItens,
  marcarCompleto,
  salvarItem,
  type ItemInstrumento,
  type PontoEscala,
} from "../../lib/instrumentos/basais";
import {
  TOTAL_BLOCOS_YSQ,
  itensDoBloco,
  primeiroBlocoIncompleto,
} from "../../lib/instrumentos/ysqBlocos";

type Carga =
  | { fase: "carregando" }
  | { fase: "erro" }
  | {
      fase: "ok";
      itens: ItemInstrumento[];
      escala: PontoEscala[];
      respostas: Map<number, number>;
    };

export function Ysq({ p }: { p: DadosParticipante }) {
  const [carga, setCarga] = useState<Carga>({ fase: "carregando" });

  useEffect(() => {
    let vivo = true;
    Promise.all([
      carregarItensYsq(),
      carregarEscala("ysq"),
      carregarRespostasItens("ysq_item_responses", p.id),
    ])
      .then(([itens, escala, respostas]) => {
        if (vivo) setCarga({ fase: "ok", itens, escala, respostas });
      })
      .catch(() => vivo && setCarga({ fase: "erro" }));
    return () => {
      vivo = false;
    };
  }, [p.id]);

  if (carga.fase === "carregando") return <p role="status">Carregando o questionário…</p>;
  if (carga.fase === "erro") {
    return (
      <div className="erro-caixa">
        Não foi possível carregar o questionário agora. Verifique sua conexão e
        recarregue a página.
      </div>
    );
  }

  return (
    <YsqInterno
      p={p}
      itens={carga.itens}
      escala={carga.escala}
      respostasIniciais={carga.respostas}
    />
  );
}

function YsqInterno({
  p,
  itens,
  escala,
  respostasIniciais,
}: {
  p: DadosParticipante;
  itens: ItemInstrumento[];
  escala: PontoEscala[];
  respostasIniciais: Map<number, number>;
}) {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();

  const [respostas, setRespostas] = useState<Map<number, number>>(respostasIniciais);
  const [bloco, setBloco] = useState(() =>
    primeiroBlocoIncompleto(respostasIniciais.keys()),
  );
  const [falhas, setFalhas] = useState<Set<number>>(new Set());
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);

  const textoPorItem = useMemo(
    () => new Map(itens.map((i) => [i.item, i.texto])),
    [itens],
  );
  const numeros = itensDoBloco(bloco);
  const valoresDoBloco = numeros.map((n) => respostas.get(n) ?? null);

  async function concluirYsq() {
    setAvancando(true);
    const { error } = await marcarCompleto("ysq_completions", p.id);
    if (error) {
      setAvancando(false);
      setErroSalvar("Não foi possível concluir agora. Tente novamente.");
      return;
    }
    await avancarEtapa(p.id, "panas");
    await recarregar();
    navigate(rotaDaEtapa("panas"), { replace: true });
  }

  const verif = useVerificacaoAvanco(p.id, async () => {
    if (bloco < TOTAL_BLOCOS_YSQ) {
      setBloco((b) => b + 1);
      window.scrollTo({ top: 0 });
    } else {
      await concluirYsq();
    }
  });

  async function responder(item: number, valor: number) {
    setRespostas((m) => new Map(m).set(item, valor));
    verif.limparAviso();
    const { error } = await salvarItem("ysq_item_responses", p.id, item, valor);
    setFalhas((s) => {
      const novo = new Set(s);
      if (error) novo.add(item);
      else novo.delete(item);
      return novo;
    });
    setErroSalvar(error ? "Uma ou mais respostas não foram salvas." : null);
  }

  async function aoContinuar() {
    setErroSalvar(null);
    if (falhas.size > 0) {
      // tenta reenviar o que falhou antes de avançar
      const pendentes = [...falhas];
      const resultados = await Promise.all(
        pendentes.map((item) =>
          salvarItem("ysq_item_responses", p.id, item, respostas.get(item)!),
        ),
      );
      const aindaFalhando = pendentes.filter((_, i) => resultados[i].error);
      setFalhas(new Set(aindaFalhando));
      if (aindaFalhando.length > 0) {
        setErroSalvar(
          "Não foi possível salvar todas as respostas. Verifique sua conexão.",
        );
        return;
      }
    }
    await verif.tentarAvancar(valoresDoBloco);
  }

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">Questionário</span>
        <h1>Questionário de Esquemas (YSQ-S3)</h1>
        <hr className="regua" />
      </div>

      <InstrucaoInstrumento slug="ysq_instrucoes" studyId={p.studyId} />
      <LegendaEscala pontos={escala} />
      <BlocoProgresso atual={bloco} total={TOTAL_BLOCOS_YSQ} />

      <div className="lista-likert">
        {numeros.map((n) => (
          <EscalaLikert
            key={n}
            nome={`ysq-${n}`}
            numero={n}
            enunciado={textoPorItem.get(n) ?? `Item ${n}`}
            pontos={escala}
            valor={respostas.get(n) ?? null}
            onChange={(v) => responder(n, v)}
            emBranco={verif.aviso && respostas.get(n) == null}
          />
        ))}
      </div>

      {verif.aviso && (
        <p className="aviso" role="alert">
          Você deixou {valoresDoBloco.filter((v) => v == null).length} questão(ões)
          sem resposta neste bloco. Toque em “Continuar” novamente para seguir
          assim mesmo.
        </p>
      )}
      {erroSalvar && <p className="erro-caixa">{erroSalvar}</p>}

      <div style={{ marginTop: "var(--espaco-6)" }}>
        <button
          type="button"
          className="botao"
          disabled={avancando}
          onClick={aoContinuar}
        >
          {bloco < TOTAL_BLOCOS_YSQ
            ? "Continuar"
            : avancando
              ? "Concluindo…"
              : "Concluir questionário"}
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
