// Edge Function: iniciar-participacao
//
// Entrada:  { token: string }   (sem JWT — o participante ainda não tem sessão)
// Saída:    { participant_id, etapa_atual, modo }
//
// Valida o convite, registra o primeiro acesso (IP/User-Agent, auditoria mínima)
// e cria/recupera a linha `participants` de forma idempotente por convite.

import { respostaJson, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { validarConvite, ipDoRequest } from "../_shared/convite.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return respostaJson({ erro: "metodo_nao_permitido" }, 405, origin);
  }

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

  const { convite } = v;

  // Participante idempotente por convite.
  let participante:
    | { id: string; etapa_atual: string; modo: "piloto" | "producao" }
    | null = null;

  {
    const { data } = await admin
      .from("participants")
      .select("id, etapa_atual, modo")
      .eq("invite_id", convite.id)
      .maybeSingle();
    participante = data as typeof participante;
  }

  if (!participante) {
    const { data, error } = await admin
      .from("participants")
      .insert({ invite_id: convite.id, modo: convite.modo })
      .select("id, etapa_atual, modo")
      .single();
    if (error || !data) {
      return respostaJson({ erro: "falha_criar_participante" }, 500, origin);
    }
    participante = data as typeof participante;
  }

  // Auditoria mínima do acesso + avanço de status do convite.
  const patch: Record<string, unknown> = {
    ultimo_acesso_ip: ipDoRequest(req),
    ultimo_acesso_user_agent: req.headers.get("user-agent"),
  };
  if (!convite.primeiro_acesso_em) patch.primeiro_acesso_em = new Date().toISOString();
  if (convite.status === "enviado") patch.status = "aberto";
  await admin.from("invites").update(patch).eq("id", convite.id);

  return respostaJson(
    {
      participant_id: participante!.id,
      etapa_atual: participante!.etapa_atual,
      modo: participante!.modo,
    },
    200,
    origin,
  );
});
