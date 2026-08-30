/**
 * Carga e gravação dos instrumentos basais (sub-projeto C).
 *
 * Texto dos itens do YSQ-S3 e do PANAS e rótulos de escala vêm do banco (views
 * de participante de 0008); enunciados do sociodemográfico são schema no bundle.
 * As respostas são normalizadas (uma linha por item) para permitir autosave e
 * retomada.
 */
import { supabase } from "../supabase";
import type {
  RespostasSociodemografico,
  CampoSociodemografico,
} from "./sociodemografico";
import type {
  MotivoInelegibilidade,
  ResultadoElegibilidade,
} from "./elegibilidade";

export interface ItemInstrumento {
  item: number;
  texto: string;
}

export interface PontoEscala {
  valor: number;
  rotulo: string;
}

export type InstrumentoComEscala = "ysq" | "panas";

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------

export async function carregarItensYsq(): Promise<ItemInstrumento[]> {
  const { data, error } = await supabase
    .from("ysq_itens_participante")
    .select("item, enunciado")
    .order("item");
  if (error || !data) throw error ?? new Error("YSQ: itens não carregados");
  return data.map((d) => ({ item: d.item as number, texto: d.enunciado as string }));
}

export async function carregarItensPanas(): Promise<ItemInstrumento[]> {
  const { data, error } = await supabase
    .from("panas_itens_participante")
    .select("item, termo")
    .order("item");
  if (error || !data) throw error ?? new Error("PANAS: itens não carregados");
  return data.map((d) => ({ item: d.item as number, texto: d.termo as string }));
}

export async function carregarEscala(
  instrumento: InstrumentoComEscala,
): Promise<PontoEscala[]> {
  const { data, error } = await supabase
    .from("escalas_instrumento_participante")
    .select("valor, rotulo")
    .eq("instrumento", instrumento)
    .order("valor");
  if (error || !data) throw error ?? new Error("escala não carregada");
  return data.map((d) => ({ valor: d.valor as number, rotulo: d.rotulo as string }));
}

export async function carregarRespostasItens(
  tabela: "ysq_item_responses" | "panas_item_responses",
  participantId: string,
): Promise<Map<number, number>> {
  const { data, error } = await supabase
    .from(tabela)
    .select("item, valor")
    .eq("participant_id", participantId);
  if (error) throw error;
  const mapa = new Map<number, number>();
  for (const d of data ?? []) mapa.set(d.item as number, d.valor as number);
  return mapa;
}

export async function carregarRespostasSociodemografico(
  participantId: string,
): Promise<RespostasSociodemografico | null> {
  const { data, error } = await supabase
    .from("sociodemographic_responses")
    .select("*")
    .eq("participant_id", participantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { participant_id: _p, atualizado_em: _a, completado_em: _c, elegivel: _e, inelegibilidade_motivos: _m, ...respostas } = data;
  return respostas as RespostasSociodemografico;
}

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

export async function salvarItem(
  tabela: "ysq_item_responses" | "panas_item_responses",
  participantId: string,
  item: number,
  valor: number,
) {
  return supabase.from(tabela).upsert(
    { participant_id: participantId, item, valor, respondido_em: new Date().toISOString() },
    { onConflict: "participant_id,item" },
  );
}

export async function marcarCompleto(
  tabela: "ysq_completions" | "panas_completions",
  participantId: string,
) {
  // As tabelas de conclusão são append-only para o participante (só INSERT).
  // ON CONFLICT DO NOTHING mantém a chamada idempotente sem exigir UPDATE.
  return supabase
    .from(tabela)
    .upsert(
      { participant_id: participantId },
      { onConflict: "participant_id", ignoreDuplicates: true },
    );
}

export async function salvarParcialSociodemografico(
  participantId: string,
  patch: Partial<Record<CampoSociodemografico, unknown>>,
) {
  return supabase
    .from("sociodemographic_responses")
    .upsert(
      { participant_id: participantId, ...patch },
      { onConflict: "participant_id" },
    );
}

export async function concluirSociodemografico(
  participantId: string,
  respostas: RespostasSociodemografico,
  resultado: ResultadoElegibilidade,
) {
  const motivos: MotivoInelegibilidade[] = resultado.motivos;
  return supabase.from("sociodemographic_responses").upsert(
    {
      participant_id: participantId,
      ...respostas,
      elegivel: resultado.elegivel,
      inelegibilidade_motivos: motivos,
      completado_em: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );
}
