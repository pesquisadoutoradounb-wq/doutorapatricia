import { supabase } from "./supabase";

export type ResultadoRecusa =
  | { ok: true; jaRecusado: boolean }
  | { ok: false; motivo: "ja_concluido" | "token_invalido" | "erro_rede" };

/**
 * Registra que o convidado não deseja participar. Chamada sem sessão (o convite
 * não exige login). Idempotente do lado do servidor.
 */
export async function recusarConvite(token: string): Promise<ResultadoRecusa> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      ja_recusado?: boolean;
    }>("recusar-convite", { body: { token } });

    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 409) return { ok: false, motivo: "ja_concluido" };
      if (status === 400 || status === 404) {
        return { ok: false, motivo: "token_invalido" };
      }
      return { ok: false, motivo: "erro_rede" };
    }
    if (!data?.ok) return { ok: false, motivo: "erro_rede" };
    return { ok: true, jaRecusado: Boolean(data.ja_recusado) };
  } catch {
    return { ok: false, motivo: "erro_rede" };
  }
}
