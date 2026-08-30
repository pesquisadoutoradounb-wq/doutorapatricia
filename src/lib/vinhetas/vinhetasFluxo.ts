/**
 * Carga e gravação do bloco de vinhetas (sub-projeto D).
 */
import { supabase } from "../supabase";
import type { CampoAvaliacao, RespostasAvaliacao } from "./avaliacaoPosImaginacao";

export interface ItemOrdem {
  vignette_id: number;
  posicao: number;
}

export interface VinhetaTexto {
  id: number;
  texto_estimulo: string;
}

export interface VinhetaAudio {
  vignette_id: number;
  url: string;
  duracao_segundos: number | null;
}

export interface RespostaVinheta {
  vignette_id: number;
  completado_em: string | null;
  audio_iniciado_em: string | null;
  audio_terminado_em: string | null;
  vinheta_continuar_em: string | null;
  avaliacao_iniciada_em: string | null;
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Posição (pura)
// ---------------------------------------------------------------------------

export interface PosicaoAtual {
  terminou: boolean;
  posicao: number; // 1..10 (ou length+1 quando terminou)
  vignetteId: number | null;
}

/** Primeira vinheta da ordem sorteada ainda sem `completado_em`. */
export function proximaPosicao(
  ordem: ItemOrdem[],
  concluidas: Iterable<number>,
): PosicaoAtual {
  const feitas = concluidas instanceof Set ? concluidas : new Set(concluidas);
  const ordenada = [...ordem].sort((a, b) => a.posicao - b.posicao);
  for (const item of ordenada) {
    if (!feitas.has(item.vignette_id)) {
      return { terminou: false, posicao: item.posicao, vignetteId: item.vignette_id };
    }
  }
  return { terminou: true, posicao: ordenada.length + 1, vignetteId: null };
}

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------

export async function gerarOuCarregarOrdem(): Promise<ItemOrdem[]> {
  const { data, error } = await supabase.rpc("gerar_ordem_vinhetas");
  if (error || !data) throw error ?? new Error("ordem das vinhetas não gerada");
  return (data as ItemOrdem[]).map((d) => ({
    vignette_id: d.vignette_id,
    posicao: d.posicao,
  }));
}

export async function carregarTextos(studyId: string): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from("vinhetas_participante")
    .select("id, texto_estimulo")
    .eq("study_id", studyId);
  if (error || !data) throw error ?? new Error("textos das vinhetas não carregados");
  return new Map(data.map((d) => [d.id as number, d.texto_estimulo as string]));
}

export async function carregarAudios(): Promise<Map<number, VinhetaAudio>> {
  const { data, error } = await supabase
    .from("audios_participante")
    .select("vignette_id, storage_path, duracao_segundos");
  if (error) throw error;
  const mapa = new Map<number, VinhetaAudio>();
  for (const d of data ?? []) {
    const { data: pub } = supabase.storage
      .from("audios")
      .getPublicUrl(d.storage_path as string);
    mapa.set(d.vignette_id as number, {
      vignette_id: d.vignette_id as number,
      url: pub.publicUrl,
      duracao_segundos: (d.duracao_segundos as number | null) ?? null,
    });
  }
  return mapa;
}

export async function carregarRespostasVinhetas(
  participantId: string,
): Promise<Map<number, RespostaVinheta>> {
  const { data, error } = await supabase
    .from("vignette_responses")
    .select("*")
    .eq("participant_id", participantId);
  if (error) throw error;
  return new Map(
    (data ?? []).map((d) => [d.vignette_id as number, d as RespostaVinheta]),
  );
}

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

type PatchVinheta = Partial<Record<CampoAvaliacao, unknown>> &
  Record<string, unknown>;

export async function salvarParcialVinheta(
  participantId: string,
  vignetteId: number,
  patch: PatchVinheta,
) {
  return supabase.from("vignette_responses").upsert(
    { participant_id: participantId, vignette_id: vignetteId, ...patch },
    { onConflict: "participant_id,vignette_id" },
  );
}

export async function concluirAvaliacaoVinheta(
  participantId: string,
  vignetteId: number,
  respostas: RespostasAvaliacao,
) {
  const agora = new Date().toISOString();
  return supabase.from("vignette_responses").upsert(
    {
      participant_id: participantId,
      vignette_id: vignetteId,
      ...respostas,
      avaliacao_enviada_em: agora,
      completado_em: agora,
    },
    { onConflict: "participant_id,vignette_id" },
  );
}

export async function concluirParticipacao() {
  return supabase.rpc("concluir_participacao");
}
