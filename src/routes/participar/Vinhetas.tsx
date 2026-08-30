import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DadosParticipante } from "../../lib/participanteContexto";
import { useParticipante } from "../../lib/participanteContexto";
import { avancarEtapa, rotaDaEtapa } from "../../lib/participantSession";
import { TocadorAudio, type TelemetriaAudio } from "../../components/participar/TocadorAudio";
import { AvaliacaoPosImaginacao } from "./AvaliacaoPosImaginacao";
import {
  carregarAudios,
  carregarRespostasVinhetas,
  carregarTextos,
  gerarOuCarregarOrdem,
  proximaPosicao,
  salvarParcialVinheta,
  type ItemOrdem,
  type RespostaVinheta,
  type VinhetaAudio,
} from "../../lib/vinhetas/vinhetasFluxo";
import {
  AVALIACAO_POS_IMAGINACAO,
  type RespostasAvaliacao,
} from "../../lib/vinhetas/avaliacaoPosImaginacao";

const INTRO_ESTIMULO =
  "Leia atentamente a situação a seguir. Quando terminar, clique em “Continuar”.";

type SubEtapa = "estimulo" | "audio" | "avaliacao";

type Carga =
  | { fase: "carregando" }
  | { fase: "erro" }
  | {
      fase: "ok";
      ordem: ItemOrdem[];
      textos: Map<number, string>;
      audios: Map<number, VinhetaAudio>;
      respostas: Map<number, RespostaVinheta>;
    };

function respostaAvaliacaoDe(r: RespostaVinheta | undefined): RespostasAvaliacao {
  if (!r) return {};
  const saida: RespostasAvaliacao = {};
  for (const q of AVALIACAO_POS_IMAGINACAO) {
    const v = r[q.campo];
    if (v != null) saida[q.campo] = v as never;
  }
  if (r.q2_emocao_outra != null) saida.q2_emocao_outra = r.q2_emocao_outra as string;
  if (r.q9_perspectiva_outra != null)
    saida.q9_perspectiva_outra = r.q9_perspectiva_outra as string;
  return saida;
}

function subEtapaInicial(r: RespostaVinheta | undefined): SubEtapa {
  if (!r || !r.vinheta_continuar_em) return "estimulo";
  if (!r.avaliacao_iniciada_em) return "audio";
  return "avaliacao";
}

export function Vinhetas({ p }: { p: DadosParticipante }) {
  const [carga, setCarga] = useState<Carga>({ fase: "carregando" });

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [ordem, textos, audios, respostas] = await Promise.all([
          gerarOuCarregarOrdem(),
          carregarTextos(p.studyId),
          carregarAudios(),
          carregarRespostasVinhetas(p.id),
        ]);
        if (vivo) setCarga({ fase: "ok", ordem, textos, audios, respostas });
      } catch {
        if (vivo) setCarga({ fase: "erro" });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [p.id, p.studyId]);

  if (carga.fase === "carregando") return <p role="status">Preparando a tarefa…</p>;
  if (carga.fase === "erro") {
    return (
      <div className="erro-caixa">
        Não foi possível preparar a tarefa agora. Verifique sua conexão e
        recarregue a página.
      </div>
    );
  }
  return <VinhetasInterno p={p} {...carga} />;
}

function VinhetasInterno({
  p,
  ordem,
  textos,
  audios,
  respostas: respostasIniciais,
}: {
  p: DadosParticipante;
  ordem: ItemOrdem[];
  textos: Map<number, string>;
  audios: Map<number, VinhetaAudio>;
  respostas: Map<number, RespostaVinheta>;
}) {
  const navigate = useNavigate();
  const { recarregar } = useParticipante();

  const [concluidas, setConcluidas] = useState<Set<number>>(
    () =>
      new Set(
        [...respostasIniciais.values()]
          .filter((r) => r.completado_em)
          .map((r) => r.vignette_id),
      ),
  );
  const pos = useMemo(() => proximaPosicao(ordem, concluidas), [ordem, concluidas]);
  const [subEtapa, setSubEtapa] = useState<SubEtapa>(() =>
    subEtapaInicial(
      pos.vignetteId != null ? respostasIniciais.get(pos.vignetteId) : undefined,
    ),
  );
  const [avancando, setAvancando] = useState(false);
  const exibidaEm = useRef<string | null>(null);

  const vid = pos.vignetteId;

  useEffect(() => {
    if (!pos.terminou) return;
    setAvancando(true);
    (async () => {
      await avancarEtapa(p.id, "encerramento");
      await recarregar();
      navigate(rotaDaEtapa("encerramento"), { replace: true });
    })();
  }, [pos.terminou, p.id, navigate, recarregar]);

  useEffect(() => {
    if (subEtapa === "estimulo" && vid != null) {
      exibidaEm.current = new Date().toISOString();
    }
  }, [subEtapa, vid]);

  if (pos.terminou || vid == null || avancando) {
    return <p role="status">Concluindo…</p>;
  }

  async function continuarDoEstimulo() {
    await salvarParcialVinheta(p.id, vid!, {
      vinheta_exibida_em: exibidaEm.current,
      vinheta_continuar_em: new Date().toISOString(),
    });
    setSubEtapa("audio");
    window.scrollTo({ top: 0 });
  }

  async function continuarDoAudio(t: TelemetriaAudio) {
    await salvarParcialVinheta(p.id, vid!, {
      audio_iniciado_em: t.iniciadoEm,
      audio_terminado_em: t.terminadoEm,
      audio_duracao_ouvida_seg: t.duracaoOuvidaSeg,
      audio_completou: t.completou,
      avaliacao_iniciada_em: new Date().toISOString(),
    });
    setSubEtapa("avaliacao");
    window.scrollTo({ top: 0 });
  }

  function aposAvaliacao() {
    setConcluidas((s) => new Set(s).add(vid!));
    setSubEtapa("estimulo");
    window.scrollTo({ top: 0 });
  }

  if (subEtapa === "estimulo") {
    return (
      <div>
        <div className="tela-titulo">
          <span className="eyebrow">Situação {pos.posicao} de 10</span>
          <h1>Leia a situação</h1>
          <hr className="regua" />
        </div>
        <p className="socio-introducao">{INTRO_ESTIMULO}</p>
        <div className="cartao vinheta-estimulo">
          <p>{textos.get(vid) ?? ""}</p>
        </div>
        <div style={{ marginTop: "var(--espaco-6)" }}>
          <button type="button" className="botao" onClick={continuarDoEstimulo}>
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (subEtapa === "audio") {
    return (
      <div>
        <div className="tela-titulo">
          <span className="eyebrow">Situação {pos.posicao} de 10</span>
          <h1>Áudio de imaginação guiada</h1>
          <hr className="regua" />
        </div>
        <TocadorAudio url={audios.get(vid)?.url ?? null} onContinuar={continuarDoAudio} />
      </div>
    );
  }

  return (
    <AvaliacaoPosImaginacao
      key={vid}
      p={p}
      vignetteId={vid}
      situacaoNumero={pos.posicao}
      respostaInicial={respostaAvaliacaoDe(respostasIniciais.get(vid))}
      onConcluida={aposAvaliacao}
    />
  );
}
