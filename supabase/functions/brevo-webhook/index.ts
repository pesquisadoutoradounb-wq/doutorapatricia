// Edge Function: brevo-webhook
//
// Recebe os eventos do Brevo e grava em `email_events`, ligados ao convite pela
// tag enviada em `send-invite` (payload.tags[0]). Não altera `invites.status` —
// essa escada é dirigida pela plataforma. Validado por BREVO_WEBHOOK_SECRET em
// `?s=` ou no cabeçalho `x-webhook-secret` (o Brevo não assina webhooks).

import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { tipoEventoBrevo, inviteIdDaTag } from "../_shared/brevoEventos.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const segredo = url.searchParams.get("s") ?? req.headers.get("x-webhook-secret");
  if (!segredo || segredo !== Deno.env.get("BREVO_WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const tipo = tipoEventoBrevo(payload["event"]);
  const inviteId = inviteIdDaTag(payload);

  const ts =
    typeof payload["date"] === "string"
      ? new Date(payload["date"] as string).toISOString()
      : typeof payload["ts"] === "number"
        ? new Date((payload["ts"] as number) * 1000).toISOString()
        : new Date().toISOString();

  const admin = supabaseAdmin();
  await admin.from("email_events").insert({
    invite_id: inviteId,
    tipo,
    ocorrido_em: ts,
    payload,
  });

  return new Response("ok", { status: 200 });
});
