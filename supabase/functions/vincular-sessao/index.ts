// Edge Function: vincular-sessao
//
// Entrada:  { token: string }   + Authorization: Bearer <JWT anônimo do cliente>
// Saída:    { ok: true }
//
// Revalida o token do convite e grava `app_metadata.participant_id` no usuário
// anônimo que fez a chamada. A partir daí, o JWT desse usuário carrega o claim
// e o RLS restringe todas as leituras/escritas às linhas daquele participante.

import { respostaJson, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin, supabaseComoUsuario } from "../_shared/supabaseAdmin.ts";
import { validarConvite } from "../_shared/convite.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return respostaJson({ erro: "metodo_nao_permitido" }, 405, origin);
  }

  // Identidade do chamador (usuário anônimo recém-criado).
  const comoUsuario = supabaseComoUsuario(req);
  const { data: userData, error: userErr } = await comoUsuario.auth.getUser();
  if (userErr || !userData.user) {
    return respostaJson({ erro: "sem_sessao" }, 401, origin);
  }
  const authUser = userData.user;

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return respostaJson({ erro: "json_invalido" }, 400, origin);
  }

  const admin = supabaseAdmin();
  const v = await validarConvite(admin, body.token);
  if (!v.ok) {
    const map: Record<number, string> = {
      400: "token_invalido",
      404: "token_invalido",
      410: "token_expirado",
      409: "ja_concluido",
    };
    return respostaJson({ erro: map[v.status] }, v.status, origin);
  }

  const { data: participante } = await admin
    .from("participants")
    .select("id, auth_user_id")
    .eq("invite_id", v.convite.id)
    .maybeSingle();

  if (!participante) {
    return respostaJson({ erro: "participante_inexistente" }, 409, origin);
  }

  // O token do convite é a credencial e já foi validado acima: vincular (ou
  // revincular) esta sessão anônima ao participante do token é legítimo, mesmo
  // que a sessão trouxesse outro claim (sessão de teste antiga, etc.).

  // Grava o claim e liga o participante a esta sessão anônima.
  const { error: updErr } = await admin.auth.admin.updateUserById(authUser.id, {
    app_metadata: { participant_id: participante.id },
  });
  if (updErr) {
    return respostaJson({ erro: "falha_vincular" }, 500, origin);
  }

  await admin
    .from("participants")
    .update({ auth_user_id: authUser.id })
    .eq("id", participante.id);

  return respostaJson({ ok: true }, 200, origin);
});
