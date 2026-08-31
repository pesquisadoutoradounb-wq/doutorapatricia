// Edge Function: iniciar-participacao
//
// Entrada:  { token: string }   (sem JWT — o participante ainda não tem sessão)
// Saída:    { participant_id, etapa_atual, modo, study_id, study_slug, study_nome }
//
// Valida o convite, registra o primeiro acesso (IP/User-Agent) e cria/recupera
// a linha `participants` de forma idempotente por convite, escopada ao estudo
// do convite.

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
    let erro: string;
    if (v.status === 409) {
      erro = v.motivo === "recusado" ? "convite_recusado" : "ja_concluido";
    } else if (v.status === 410) {
      erro = "token_expirado";
    } else {
      erro = "token_invalido";
    }
    return respostaJson({ erro }, v.status, origin);
  }

  const { convite } = v;

  const { data: estudo } = await admin
    .from("studies")
    .select("slug, nome")
    .eq("id", convite.study_id)
    .maybeSingle();

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
      .insert({ invite_id: convite.id, modo: convite.modo, study_id: convite.study_id })
      .select("id, etapa_atual, modo")
      .single();
    if (error || !data) {
      return respostaJson({ erro: "falha_criar_participante" }, 500, origin);
    }
    participante = data as typeof participante;
  }

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
      study_id: convite.study_id,
      study_slug: estudo?.slug ?? null,
      study_nome: estudo?.nome ?? null,
    },
    200,
    origin,
  );
});
