import { supabase, participantIdAtual } from "./supabase";

/**
 * Etapas do fluxo do participante no Estudo 1 (espelha o enum `participant_step`).
 * A ordem é obrigatória; `etapa_atual` permite retomar de onde parou.
 *
 * Multi-estudo: por ora o enum é o do Estudo 1. Quando o Estudo 2 tiver um
 * fluxo diferente, isto migra para uma tabela `study_steps`.
 */
export const ETAPAS = [
  "informacoes",
  "tcle",
  "sociodemografico",
  "ysq",
  "panas",
  "instrucoes",
  "vinhetas",
  "encerramento",
  "concluido",
] as const;

export type Etapa = (typeof ETAPAS)[number];

export interface SessaoParticipante {
  participantId: string;
  etapaAtual: Etapa;
  modo: "piloto" | "producao";
  studyId: string;
  studySlug: string | null;
  studyNome: string | null;
}

export type MotivoFalha =
  | "token_invalido"
  | "token_expirado"
  | "ja_concluido"
  | "erro_rede";

export type ResultadoEntrada =
  | { ok: true; sessao: SessaoParticipante }
  | { ok: false; motivo: MotivoFalha };

interface RespostaIniciar {
  participant_id: string;
  etapa_atual: Etapa;
  modo: "piloto" | "producao";
  study_id: string;
  study_slug: string | null;
  study_nome: string | null;
}

export async function entrarComToken(token: string): Promise<ResultadoEntrada> {
  let iniciar: RespostaIniciar;
  try {
    const { data, error } = await supabase.functions.invoke<RespostaIniciar>(
      "iniciar-participacao",
      { body: { token } },
    );
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 404) return { ok: false, motivo: "token_invalido" };
      if (status === 410) return { ok: false, motivo: "token_expirado" };
      if (status === 409) return { ok: false, motivo: "ja_concluido" };
      return { ok: false, motivo: "erro_rede" };
    }
    if (!data) return { ok: false, motivo: "erro_rede" };
    iniciar = data;
  } catch {
    return { ok: false, motivo: "erro_rede" };
  }

  const jaVinculado = (await participantIdAtual()) === iniciar.participant_id;

  if (!jaVinculado) {
    // Limpa qualquer sessão anterior (outro participante, teste antigo, expirada)
    // antes de criar a sessão anônima deste convite — senão vincular-sessao recusa.
    await supabase.auth.signOut().catch(() => {});

    const { data: anon, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr || !anon.user) return { ok: false, motivo: "erro_rede" };

    const { error: vincErr } = await supabase.functions.invoke("vincular-sessao", {
      body: { token },
    });
    if (vincErr) return { ok: false, motivo: "erro_rede" };

    await supabase.auth.refreshSession();
  }

  return {
    ok: true,
    sessao: {
      participantId: iniciar.participant_id,
      etapaAtual: iniciar.etapa_atual,
      modo: iniciar.modo,
      studyId: iniciar.study_id,
      studySlug: iniciar.study_slug,
      studyNome: iniciar.study_nome,
    },
  };
}

/** Caminho da rota para uma etapa (dentro de /participar). */
export function rotaDaEtapa(etapa: Etapa): string {
  switch (etapa) {
    case "informacoes":
      return "/participar/informacoes";
    case "tcle":
      return "/participar/tcle";
    case "encerramento":
    case "concluido":
      return "/participar/encerramento";
    default:
      return `/participar/etapa/${etapa}`;
  }
}

/**
 * Avança `etapa_atual` do participante. O trigger no banco só permite avançar
 * uma etapa por vez (ou permanecer), então isto é seguro contra pulos.
 */
export async function avancarEtapa(participantId: string, novaEtapa: Etapa) {
  return supabase
    .from("participants")
    .update({ etapa_atual: novaEtapa })
    .eq("id", participantId);
}

export function proximaEtapa(atual: Etapa): Etapa {
  const i = ETAPAS.indexOf(atual);
  return ETAPAS[Math.min(i + 1, ETAPAS.length - 1)];
}
