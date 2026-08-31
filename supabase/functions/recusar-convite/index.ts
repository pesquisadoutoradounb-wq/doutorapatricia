// Edge Function: recusar-convite
//
// Entrada:  { token: string }   (sem JWT — o convidado não tem sessão)
// Saída:    { ok: true, ja_recusado?: boolean }
//
// Registra que o convidado não deseja participar. Idempotente. Não altera nem
// expõe e-mail/nome. Um convite EXPIRADO ainda pode ser recusado (o convidado
// só quer parar de receber contato); um convite JÁ CONCLUÍDO, não.

import { respostaJson, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const token = body.token;
  if (typeof token !== "string" || !UUID_RE.test(token)) {
    return respostaJson({ erro: "token_invalido" }, 400, origin);
  }

  const admin = supabaseAdmin();

  const { data: convite } = await admin
    .from("invites")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (!convite) {
    return respostaJson({ erro: "token_invalido" }, 404, origin);
  }
  if (convite.status === "concluido") {
    return respostaJson({ erro: "ja_concluido" }, 409, origin);
  }
  if (convite.status === "recusou") {
    return respostaJson({ ok: true, ja_recusado: true }, 200, origin);
  }

  const agora = new Date().toISOString();
  await admin
    .from("invites")
    .update({ status: "recusou", recusado_em: agora })
    .eq("id", convite.id);
  await admin.from("email_events").insert({
    invite_id: convite.id,
    tipo: "outro",
    ocorrido_em: agora,
    payload: { evento: "recusa", via: "email" },
  });

  return respostaJson({ ok: true }, 200, origin);
});
