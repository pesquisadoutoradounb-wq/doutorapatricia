import { supabase } from "./supabase";

export interface OpcaoConsentimento {
  valor: "aceitou" | "recusou";
  ordem: number;
  texto: string;
}

export async function carregarOpcoesConsentimento(
  studyId: string,
): Promise<OpcaoConsentimento[]> {
  const { data, error } = await supabase
    .from("consent_options_publico")
    .select("valor, ordem, texto")
    .eq("study_id", studyId)
    .order("ordem");
  if (error || !data) return [];
  return data as OpcaoConsentimento[];
}

/** Retorna o consent_record já registrado deste participante, se houver. */
export async function consentimentoExistente(participantId: string) {
  const { data } = await supabase
    .from("consent_records")
    .select("id, decisao, tcle_versao, tcle_texto_snapshot, registrado_em")
    .eq("participant_id", participantId)
    .order("registrado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as
    | {
        id: string;
        decisao: "aceitou" | "recusou";
        tcle_versao: string;
        tcle_texto_snapshot: string;
        registrado_em: string;
      }
    | null;
}

/**
 * Grava a decisão do TCLE com snapshot imutável do texto exibido.
 * O IP não é capturado aqui (o cliente não o conhece de forma confiável); a
 * auditoria de acesso fica no registro do convite. Mover para Edge Function
 * se o CEP exigir IP por consentimento.
 */
export async function registrarConsentimento(params: {
  participantId: string;
  decisao: "aceitou" | "recusou";
  tcleVersao: string;
  tcleTextoSnapshot: string;
}) {
  return supabase.from("consent_records").insert({
    participant_id: params.participantId,
    decisao: params.decisao,
    tcle_versao: params.tcleVersao,
    tcle_texto_snapshot: params.tcleTextoSnapshot,
    user_agent: navigator.userAgent,
  });
}
