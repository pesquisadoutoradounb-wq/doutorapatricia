import { useEffect, useMemo, useState } from "react";
import { useEstudo } from "./EstudoLayout";
import { AlternadorModo } from "../../components/painel/AlternadorModo";
import { CartaoKPI, BarrasH } from "../../components/painel/graficos";
import { supabase } from "../../lib/supabase";
import {
  DOMINIOS_YSQ,
  ESQUEMAS_YSQ,
  escorePanas,
  escoreYsq,
  mapaDeRespostas,
  media,
} from "../../lib/pontuacao";

interface Linha {
  participant_id: string;
  item: number;
  valor: number;
}

async function carregarItens(
  tabela: "ysq_item_responses" | "panas_item_responses",
  ids: string[],
): Promise<Linha[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from(tabela)
    .select("participant_id, item, valor")
    .in("participant_id", ids);
  return (data ?? []) as Linha[];
}

export function Resultados() {
  const estudo = useEstudo();
  const [incluirPiloto, setIncluirPiloto] = useState(false);
  const [ysq, setYsq] = useState<Linha[] | null>(null);
  const [panas, setPanas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!estudo) return;
    setYsq(null);
    setPanas(null);
    setErro(false);
    (async () => {
      let q = supabase
        .from("participants")
        .select("id")
        .eq("study_id", estudo.id)
        .eq("descartado", false);
      if (!incluirPiloto) q = q.eq("modo", "producao");
      const { data, error } = await q;
      if (error) return setErro(true);
      const ids = (data ?? []).map((p) => p.id as string);
      const [y, p] = await Promise.all([
        carregarItens("ysq_item_responses", ids),
        carregarItens("panas_item_responses", ids),
      ]);
      setYsq(y);
      setPanas(p);
    })().catch(() => setErro(true));
  }, [estudo, incluirPiloto]);

  const ysqAgg = useMemo(() => {
    if (!ysq) return null;
    const porPart = [...mapaDeRespostas(ysq).values()].map(escoreYsq);
    if (porPart.length === 0) return null;
    return {
      n: porPart.length,
      dominios: DOMINIOS_YSQ.map((d) => ({
        rotulo: d.nome,
        valor:
          media(porPart.map((e) => e.dominios.find((x) => x.indice === d.indice)?.media)) ??
          0,
      })),
      esquemas: ESQUEMAS_YSQ.map((s) => ({
        nome: s.nome,
        mediaGrupo:
          media(porPart.map((e) => e.esquemas.find((x) => x.indice === s.indice)?.media)) ??
          null,
      })).sort((a, b) => (b.mediaGrupo ?? 0) - (a.mediaGrupo ?? 0)),
    };
  }, [ysq]);

  const panasAgg = useMemo(() => {
    if (!panas) return null;
    const porPart = [...mapaDeRespostas(panas).values()].map(escorePanas);
    const comResposta = porPart.filter((e) => e.paRespondidos + e.naRespondidos > 0);
    if (comResposta.length === 0) return null;
    return {
      n: comResposta.length,
      pa: media(comResposta.map((e) => e.paMedia)),
      na: media(comResposta.map((e) => e.naMedia)),
    };
  }, [panas]);

  return (
    <div>
      <div className="tela-titulo">
        <span className="eyebrow">{estudo?.nome}</span>
        <h1>Resultados</h1>
        <hr className="regua" />
      </div>
      <p className="documento__versao">
        Médias entre participantes. Escores por participante estão na aba
        Exportar. Pontos de corte do YSQ e faixas do PANAS ainda pendentes da
        pesquisadora.
      </p>

      <div style={{ margin: "var(--espaco-4) 0" }}>
        <AlternadorModo incluirPiloto={incluirPiloto} onChange={setIncluirPiloto} />
      </div>

      {erro && <p className="erro-caixa">Não foi possível carregar os resultados.</p>}
      {!erro && (!ysq || !panas) && <p role="status">Calculando…</p>}

      {ysq && panas && (
        <>
          <h2>YSQ-S3</h2>
          {ysqAgg ? (
            <>
              <p className="documento__versao">{ysqAgg.n} participante(s) com respostas.</p>
              <div className="dash-grade">
                <BarrasH titulo="Média por domínio (1–6)" dados={ysqAgg.dominios} />
              </div>
              <table className="tabela" style={{ marginTop: "var(--espaco-4)" }}>
                <thead>
                  <tr><th>Esquema</th><th>Média do grupo</th></tr>
                </thead>
                <tbody>
                  {ysqAgg.esquemas.map((s) => (
                    <tr key={s.nome}>
                      <td>{s.nome}</td>
                      <td>{s.mediaGrupo?.toFixed(2) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="aviso">Ainda sem respostas do YSQ-S3.</p>
          )}

          <h2 style={{ marginTop: "var(--espaco-8)" }}>PANAS</h2>
          {panasAgg ? (
            <div className="kpis">
              <CartaoKPI valor={panasAgg.pa?.toFixed(2) ?? "—"} rotulo="Afeto positivo (média, 1–5)" />
              <CartaoKPI valor={panasAgg.na?.toFixed(2) ?? "—"} rotulo="Afeto negativo (média, 1–5)" />
              <CartaoKPI valor={panasAgg.n} rotulo="Participantes" />
            </div>
          ) : (
            <p className="aviso">Ainda sem respostas do PANAS.</p>
          )}
        </>
      )}
    </div>
  );
}
