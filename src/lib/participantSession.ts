import { supabase, participantIdAtual } from "./supabase";

/**
 * Etapas do fluxo do participante (espelha o enum `participant_step` no banco).
 * A ordem é obrigatória; `etapa_atual` permite retomar de onde parou.
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
}

/**
 * Troca um token de convite por uma sessão de participante.
 *
 *  1. `iniciar-participacao` valida o convite e cria/recupera a linha
 *     `participants` (idempotente por invite). Não exige sessão.
 *  2. Se ainda não há sessão anônima ligada a este participante:
 *     `signInAnonymously()` cria a sessão e `vincular-sessao` grava
 *     `app_metadata.participant_id` no usuário anônimo (validando o token de novo).
 *  3. Refresh da sessão para o JWT carregar o claim.
 *
 * O token do convite é a credencial. Se a mesma pessoa reabrir o link em outro
 * dispositivo, uma nova sessão anônima é vinculada ao mesmo `participant_id`.
 */
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
    },
  };
}

/** Caminho da rota para uma etapa (dentro de /participar). */
export function rotaDaEtapa(etapa: Etapa): string {
  if (etapa === "concluido" || etapa === "encerramento") {
    return "/participar/encerramento";
  }
  return `/participar/etapa/${etapa}`;
}
