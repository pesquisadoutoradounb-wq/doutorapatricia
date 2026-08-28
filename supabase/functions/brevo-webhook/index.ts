// Edge Function: brevo-webhook  (STUB parcial — completa no sub-projeto E)
//
// Recebe eventos do Brevo (entregue/aberto/clicado/bounce/spam) e grava em
// `email_events`, atualizando o status agregado do convite. Validado por um
// segredo compartilhado (BREVO_WEBHOOK_SECRET) passado como query string ?s=
// ou cabeçalho, já que o Brevo não assina os webhooks.

import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

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

  // Mapeamento completo Brevo -> email_event_type entra no sub-projeto E.
  const admin = supabaseAdmin();
  await admin.from("email_events").insert({
    invite_id: null,
    tipo: "outro",
    payload,
  });

  return new Response("ok", { status: 200 });
});
