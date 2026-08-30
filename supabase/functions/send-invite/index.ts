// Edge Function: send-invite
//
// Cria convites (individual / lote / CSV vindo do painel) e dispara o e-mail
// transacional pelo Brevo, renderizando o HTML editável `convite_email`.
// Também reenvia um convite existente. Só admin com permissão de escrita passa.
//
// Secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, APP_BASE_URL.

import { respostaJson, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin, supabaseComoUsuario } from "../_shared/supabaseAdmin.ts";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const DIAS_PADRAO = 30;

interface EntradaConvite {
  email: string;
  nome?: string | null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCorpo(html: string, nome: string | null, link: string): string {
  const linkHtml = `<a href="${escapeHtml(link)}">${escapeHtml(link)}</a>`;
  return html
    .split("{{nome}}").join(escapeHtml(nome || "participante"))
    .split("{{link}}").join(linkHtml);
}

async function carregarDocConvite(admin: ReturnType<typeof supabaseAdmin>, studyId: string) {
  const { data } = await admin
    .from("study_documents")
    .select("titulo, corpo_html")
    .eq("study_id", studyId)
    .eq("slug", "convite_email")
    .eq("ativo", true)
    .maybeSingle();
  return data as { titulo: string; corpo_html: string } | null;
}

async function enviarBrevo(
  cfg: { apiKey: string; senderEmail: string; senderName: string },
  destino: { email: string; nome?: string | null },
  assunto: string,
  html: string,
  inviteId: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const resp = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": cfg.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: cfg.senderName, email: cfg.senderEmail },
        to: [{ email: destino.email, name: destino.nome || undefined }],
        subject: assunto,
        htmlContent: html,
        tags: [inviteId],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return { ok: false, erro: `Brevo ${resp.status}: ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: `falha de rede: ${(e as Error).message}` };
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return respostaJson({ erro: "metodo_nao_permitido" }, 405, origin);

  const cliente = supabaseComoUsuario(req);
  const { data: userData } = await cliente.auth.getUser();
  if (!userData.user) return respostaJson({ erro: "nao_autenticado" }, 401, origin);
  const { data: pode } = await cliente.rpc("admin_pode_escrever");
  if (!pode) return respostaJson({ erro: "sem_permissao" }, 403, origin);

  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") ?? "Equipe de Pesquisa";
  const appUrl = Deno.env.get("APP_BASE_URL");
  if (!apiKey || !senderEmail || !appUrl) {
    return respostaJson({ erro: "brevo_nao_configurado" }, 501, origin);
  }
  const cfg = { apiKey, senderEmail, senderName };

  let body: Record<string, unknown> | null;
  try {
    body = await req.json();
  } catch {
    return respostaJson({ erro: "json_invalido" }, 400, origin);
  }
  if (!body) return respostaJson({ erro: "json_invalido" }, 400, origin);

  const admin = supabaseAdmin();
  const agora = () => new Date().toISOString();
  const expiraPadrao = () =>
    new Date(Date.now() + DIAS_PADRAO * 86_400_000).toISOString();

  // ---------------- reenviar ----------------
  if (typeof body.reenviar_invite_id === "string") {
    const { data: inv } = await admin
      .from("invites")
      .select("id, email, nome, token, study_id")
      .eq("id", body.reenviar_invite_id)
      .maybeSingle();
    if (!inv) return respostaJson({ erro: "convite_inexistente" }, 404, origin);

    const doc = await carregarDocConvite(admin, inv.study_id);
    if (!doc) return respostaJson({ erro: "sem_documento_convite" }, 501, origin);

    const link = `${appUrl}/#/participar/${inv.token}`;
    const env = await enviarBrevo(
      cfg,
      { email: inv.email, nome: inv.nome },
      doc.titulo,
      renderCorpo(doc.corpo_html, inv.nome, link),
      inv.id,
    );
    if (!env.ok) {
      return respostaJson({ criados: 0, enviados: 0, erros: [{ email: inv.email, motivo: env.erro }] }, 200, origin);
    }
    await admin
      .from("invites")
      .update({ status: "enviado", enviado_em: agora(), expira_em: expiraPadrao() })
      .eq("id", inv.id);
    await admin.from("email_events").insert({ invite_id: inv.id, tipo: "enviado", payload: { via: "reenvio" } });
    return respostaJson({ criados: 0, enviados: 1, erros: [] }, 200, origin);
  }

  // ---------------- criar + enviar ----------------
  const studyId = typeof body.study_id === "string" ? body.study_id : null;
  const convites: EntradaConvite[] = Array.isArray(body.convites)
    ? (body.convites as EntradaConvite[])
    : [];
  const modo = body.modo === "piloto" ? "piloto" : "producao";
  const expira = typeof body.expira_em === "string" ? body.expira_em : expiraPadrao();
  if (!studyId || convites.length === 0) {
    return respostaJson({ erro: "entrada_invalida" }, 400, origin);
  }

  const doc = await carregarDocConvite(admin, studyId);
  if (!doc) return respostaJson({ erro: "sem_documento_convite" }, 501, origin);

  let criados = 0;
  let enviados = 0;
  const erros: { email: string; motivo: string }[] = [];

  for (const c of convites) {
    const email = String(c.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      erros.push({ email, motivo: "e-mail inválido" });
      continue;
    }

    let inv:
      | { id: string; token: string }
      | null = null;

    const { data: existente } = await admin
      .from("invites")
      .select("id, token")
      .eq("study_id", studyId)
      .eq("email", email)
      .neq("status", "concluido")
      .maybeSingle();

    if (existente) {
      inv = existente;
    } else {
      const { data: novo, error } = await admin
        .from("invites")
        .insert({
          study_id: studyId,
          email,
          nome: c.nome ?? null,
          modo,
          status: "enviado",
          expira_em: expira,
          criado_por: userData.user.id,
        })
        .select("id, token")
        .single();
      if (error || !novo) {
        erros.push({ email, motivo: "falha ao criar convite" });
        continue;
      }
      inv = novo;
      criados++;
    }

    const link = `${appUrl}/#/participar/${inv.token}`;
    const env = await enviarBrevo(
      cfg,
      { email, nome: c.nome },
      doc.titulo,
      renderCorpo(doc.corpo_html, c.nome ?? null, link),
      inv.id,
    );
    if (!env.ok) {
      erros.push({ email, motivo: env.erro });
      continue;
    }
    await admin
      .from("invites")
      .update({ status: "enviado", enviado_em: agora(), expira_em: expira })
      .eq("id", inv.id);
    await admin.from("email_events").insert({ invite_id: inv.id, tipo: "enviado", payload: {} });
    enviados++;
  }

  return respostaJson({ criados, enviados, erros }, 200, origin);
});
