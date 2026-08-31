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

/**
 * Estados terminais fora da sequência feliz. Uma vez aqui, o participante não
 * avança mais e o link de convite não retoma (mensagem de encerramento).
 *  - `inelegivel`: reprovado nos critérios do sociodemográfico (idade / seção C).
 *  - `interrompido`: pediu para cancelar a participação no modal de abandono.
 */
export const ETAPAS_TERMINAIS = ["inelegivel", "interrompido"] as const;

export type EtapaTerminal = (typeof ETAPAS_TERMINAIS)[number];

export type EtapaParticipante = Etapa | EtapaTerminal;

export function ehEtapaTerminal(etapa: string): etapa is EtapaTerminal {
  return (ETAPAS_TERMINAIS as readonly string[]).includes(etapa);
}

export interface SessaoParticipante {
  participantId: string;
  etapaAtual: EtapaParticipante;
  modo: "piloto" | "producao";
  studyId: string;
  studySlug: string | null;
  studyNome: string | null;
}

export type MotivoFalha =
  | "token_invalido"
  | "token_expirado"
  | "ja_concluido"
  | "convite_recusado"
  | "erro_rede";

export type ResultadoEntrada =
  | { ok: true; sessao: SessaoParticipante }
  | { ok: false; motivo: MotivoFalha };

interface RespostaIniciar {
  participant_id: string;
  etapa_atual: EtapaParticipante;
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
      const ctx = (error as { context?: Response }).context;
      const status = ctx?.status;
      if (status === 400 || status === 404) return { ok: false, motivo: "token_invalido" };
      if (status === 410) return { ok: false, motivo: "token_expirado" };
      if (status === 409) {
        let corpo: { erro?: string } = {};
        try {
          corpo = (await ctx?.clone().json()) ?? {};
        } catch {
          corpo = {};
        }
        return {
          ok: false,
          motivo: corpo.erro === "convite_recusado" ? "convite_recusado" : "ja_concluido",
        };
      }
      return { ok: false, motivo: "erro_rede" };
    }
    if (!data) return { ok: false, motivo: "erro_rede" };
    iniciar = data;
  } catch {
    return { ok: false, motivo: "erro_rede" };
  }

  let claimAtual: string | null = null;
  try {
    claimAtual = await participantIdAtual();
  } catch {
    claimAtual = null;
  }
  const jaVinculado = claimAtual === iniciar.participant_id;

  if (!jaVinculado) {
    // Descarta qualquer sessão presa neste navegador (teste antigo, refresh
    // token morto, outro participante). scope 'local' NÃO invalida sessões do
    // mesmo participante em outros dispositivos — o link continua servindo em
    // qualquer lugar para retomar.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});

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
export function rotaDaEtapa(etapa: EtapaParticipante): string {
  switch (etapa) {
    case "informacoes":
      return "/participar/informacoes";
    case "tcle":
      return "/participar/tcle";
    case "encerramento":
    case "concluido":
      return "/participar/encerramento";
    case "inelegivel":
      return "/participar/inelegivel";
    case "interrompido":
      return "/participar/interrompido";
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

/**
 * Encerra a participação num estado terminal (`inelegivel` ou `interrompido`).
 * O trigger `validar_avanco_etapa` aceita a transição do sociodemográfico para
 * `inelegivel` e de qualquer etapa não-terminal para `interrompido`.
 */
export async function encerrarParticipacao(
  participantId: string,
  etapa: EtapaTerminal,
) {
  return supabase
    .from("participants")
    .update({ etapa_atual: etapa })
    .eq("id", participantId);
}

export function proximaEtapa(atual: Etapa): Etapa {
  const i = ETAPAS.indexOf(atual);
  return ETAPAS[Math.min(i + 1, ETAPAS.length - 1)];
}
