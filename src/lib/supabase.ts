import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

/**
 * Cliente Supabase compartilhado.
 *
 * Duas "personas" usam este mesmo cliente, nunca ao mesmo tempo no mesmo
 * dispositivo em uso normal:
 *  - Participante: autentica anonimamente; o JWT recebe o claim
 *    `app_metadata.participant_id` via Edge Function `vincular-sessao`.
 *    O RLS restringe cada participante às suas próprias linhas.
 *  - Equipe de pesquisa: autentica com e-mail/senha (Supabase Auth) e é
 *    reconhecida pela tabela `research_admins`.
 *
 * A sessão é persistida em localStorage (chave abaixo) para permitir retomar
 * o preenchimento de onde parou.
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "doutorapatricia.auth",
  },
});

/** Lê o participant_id do JWT atual, se houver. */
export async function participantIdAtual(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const claim = data.session?.user?.app_metadata?.participant_id;
  return typeof claim === "string" ? claim : null;
}
