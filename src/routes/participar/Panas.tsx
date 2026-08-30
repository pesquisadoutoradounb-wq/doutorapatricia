import { useEffect, useState } from "react";
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
import {
  carregarEscala,
  carregarItensPanas,
  carregarRespostasItens,
  marcarCompleto,
  salvarItem,
  type ItemInstrumento,
  type PontoEscala,
} from "../../lib/instrumentos/basais";

type Carga =
  | { fase: "carregando" }
  | { fase: "erro" }
  | {
      fase: "ok";
      itens: ItemInstrumento[];
      escala: PontoEscala[];
      respostas: Map<number, number>;
    };

export function Panas({ p }: { p: DadosParticipante }) {
  const [carga, setCarga] = useState<Carga>({ fase: "carregando" });

  useEffect(() => {
    let vivo = true;
    Promise.all([
      carregarItensPanas(),
      carregarEscala("panas"),
      carregarRespostasItens("panas_item_responses", p.id),
    ])
      .then(([itens, escala, respostas]) => {
        if (vivo) setCarga({ fase: "ok", itens, escala, respostas });
      })
      .catch(() => vivo && setCarga({ fase: "erro" }));
    return () => {
      vivo = false;
    };
  }, [p.id]);

  if (carga.fase === "carregando") return <p role="status">Carregando a escala…</p>;
  if (carga.fase === "erro") {
    return (
      <div className="erro-caixa">
        Não foi possível carregar a escala agora. Verifique sua conexão e
        recarregue a página.
      </div>
    );
  }

  return (
    <PanasInterno
      p={p}
      itens={carga.itens}
      escala={carga.escala}
      respostasIniciais={carga.respostas}
    />
  );
}

function PanasInterno({
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
  const [falhas, setFalhas] = useState<Set<number>>(new Set());
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);

  const valores = itens.map((i) => respostas.get(i.item) ?? null);

  const verif = useVerificacaoAvanco(p.id, async () => {
    setAvancando(true);
    const { error } = await marcarCompleto("panas_completions", p.id);
    if (error) {
      setAvancando(false);
      setErroSalvar("Não foi possível concluir agora. Tente novamente.");
      return;
    }
    await avancarEtapa(p.id, "instrucoes");
    await recarregar();
    navigate(rotaDaEtapa("instrucoes"), { replace: true });
  });

  async function responder(item: number, valor: number) {
    setRespostas((m) => new Map(m).set(item, valor));
    verif.limparAviso();
    const { error } = await salvarItem("panas_item_responses", p.id, item, valor);
    setFalhas((s) => {
      const novo = new Set(s);
      if (error) novo.add(item);
      else novo.delete(item);
      return novo;
    });
    setErroSalvar(error ? "Uma ou mais respostas não foram salvas." : null);
  }

  async function aoConcluir() {
    setErroSalvar(null);
    if (falhas.size > 0) {
      const pendentes = [...falhas];
      const resultados = await Promise.all(
        pendentes.map((item) =>
          salvarItem("panas_item_responses", p.id, item, respostas.get(item)!),
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
    await verif.tentarAvancar(valores);
  }

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">Escala</span>
        <h1>Escala de Afetos Positivos e Negativos (PANAS)</h1>
        <hr className="regua" />
      </div>

      <InstrucaoInstrumento slug="panas_instrucoes" studyId={p.studyId} />
      <LegendaEscala pontos={escala} />

      <div className="lista-likert">
        {itens.map((i) => (
          <EscalaLikert
            key={i.item}
            nome={`panas-${i.item}`}
            enunciado={i.texto}
            pontos={escala}
            valor={respostas.get(i.item) ?? null}
            onChange={(v) => responder(i.item, v)}
            emBranco={verif.aviso && respostas.get(i.item) == null}
          />
        ))}
      </div>

      {verif.aviso && (
        <p className="aviso" role="alert">
          Você deixou {valores.filter((v) => v == null).length} palavra(s) sem
          resposta. Toque em “Concluir” novamente para seguir assim mesmo.
        </p>
      )}
      {erroSalvar && <p className="erro-caixa">{erroSalvar}</p>}

      <div style={{ marginTop: "var(--espaco-6)" }}>
        <button
          type="button"
          className="botao"
          disabled={avancando}
          onClick={aoConcluir}
        >
          {avancando ? "Concluindo…" : "Concluir"}
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
