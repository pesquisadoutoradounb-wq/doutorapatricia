import { supabase } from "./supabase";

export interface ParticipanteAdmin {
  id: string;
  invite_id: string;
  modo: "piloto" | "producao";
  etapa_atual: string;
  criado_em: string;
  concluido_em: string | null;
  descartado: boolean;
  descartado_nota: string | null;
}

export async function listarParticipantes(
  studyId: string,
  {
    incluirPiloto = false,
    incluirDescartados = false,
  }: { incluirPiloto?: boolean; incluirDescartados?: boolean } = {},
): Promise<ParticipanteAdmin[]> {
  let q = supabase
    .from("participants")
    .select(
      "id, invite_id, modo, etapa_atual, criado_em, concluido_em, descartado, descartado_nota",
    )
    .eq("study_id", studyId)
    .order("criado_em", { ascending: false });
  if (!incluirPiloto) q = q.eq("modo", "producao");
  if (!incluirDescartados) q = q.eq("descartado", false);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as ParticipanteAdmin[];
}

export async function definirDescarte(
  participantId: string,
  descartado: boolean,
  nota: string | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("definir_descarte", {
    p_participant: participantId,
    p_descartado: descartado,
    p_nota: nota,
  });
  return { error: error?.message ?? null };
}

/** id curto para exibição (o pseudônimo completo é um uuid). */
export function pseudonimoCurto(id: string): string {
  return id.slice(0, 8);
}

export function tempoTotal(criado: string, concluido: string | null): string | null {
  if (!concluido) return null;
  const ms = new Date(concluido).getTime() - new Date(criado).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}
