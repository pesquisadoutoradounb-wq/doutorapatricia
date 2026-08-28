import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * Cliente com service_role — ignora RLS. Use somente onde é inevitável:
 * validar token de convite, criar `participants`, gravar claim no usuário
 * anônimo, sortear a ordem das vinhetas, gravar eventos de webhook.
 */
export function supabaseAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Cliente no contexto do chamador (repassa o Authorization). Respeita RLS. */
export function supabaseComoUsuario(req: Request): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
