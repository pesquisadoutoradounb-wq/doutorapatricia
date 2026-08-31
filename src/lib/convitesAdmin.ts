import { supabase } from "./supabase";
import { linkDeConvite } from "./config";
import type { LinhaConvite } from "./csvConvites";

export interface ConviteAdmin {
  id: string;
  email: string;
  nome: string | null;
  modo: "piloto" | "producao";
  status: string;
  token: string;
  enviado_em: string | null;
  expira_em: string | null;
  primeiro_acesso_em: string | null;
  criado_em: string;
  /** camada de entrega do e-mail (webhook do Brevo) */
  email_aberto: boolean;
  email_entregue: boolean;
}

export interface ResultadoEnvio {
  criados: number;
  enviados: number;
  erros: { email: string; motivo: string }[];
}

export const linkDoConvite = linkDeConvite;

export async function listarConvites(
  studyId: string,
  { incluirPiloto = false }: { incluirPiloto?: boolean } = {},
): Promise<ConviteAdmin[]> {
  let q = supabase
    .from("invites")
    .select(
      "id, email, nome, modo, status, token, enviado_em, expira_em, primeiro_acesso_em, criado_em",
    )
    .eq("study_id", studyId)
    .order("criado_em", { ascending: false });
  if (!incluirPiloto) q = q.eq("modo", "producao");
  const { data, error } = await q;
  if (error || !data) return [];

  const base = data as Omit<ConviteAdmin, "email_aberto" | "email_entregue">[];

  // camada de entrega do e-mail (Brevo → email_events)
  const abertos = new Set<string>();
  const entregues = new Set<string>();
  if (base.length > 0) {
    const { data: eventos } = await supabase
      .from("email_events")
      .select("invite_id, tipo")
      .in(
        "invite_id",
        base.map((c) => c.id),
      );
    for (const e of eventos ?? []) {
      if (!e.invite_id) continue;
      if (e.tipo === "aberto") abertos.add(e.invite_id);
      else if (e.tipo === "entregue") entregues.add(e.invite_id);
    }
  }

  return base.map((c) => ({
    ...c,
    email_aberto: abertos.has(c.id),
    email_entregue: entregues.has(c.id),
  }));
}

async function chamarSendInvite(
  body: Record<string, unknown>,
): Promise<
  { ok: true; resultado: ResultadoEnvio } | { ok: false; motivo: string }
> {
  const { data, error } = await supabase.functions.invoke("send-invite", { body });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 403) return { ok: false, motivo: "Sem permissão de escrita." };
    if (status === 501)
      return {
        ok: false,
        motivo:
          "Envio de e-mail ainda não configurado (Brevo). Cadastre os secrets da função.",
      };
    return { ok: false, motivo: "Não foi possível enviar agora." };
  }
  return { ok: true, resultado: data as ResultadoEnvio };
}

export function criarConvites(
  studyId: string,
  convites: LinhaConvite[],
  opts: { expira_em?: string; modo?: "piloto" | "producao" } = {},
) {
  return chamarSendInvite({ study_id: studyId, convites, ...opts });
}

export function reenviarConvite(inviteId: string) {
  return chamarSendInvite({ reenviar_invite_id: inviteId });
}

export async function gerarLinkTeste(
  studyId: string,
): Promise<{ ok: true; link: string } | { ok: false; motivo: string }> {
  const { data, error } = await supabase.rpc("criar_convite_piloto", {
    p_study: studyId,
  });
  if (error || !data) {
    return { ok: false, motivo: "Não foi possível gerar o link de teste." };
  }
  const linha = Array.isArray(data) ? data[0] : data;
  return { ok: true, link: linkDeConvite((linha as { token: string }).token) };
}

export async function excluirConvite(
  inviteId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("invites").delete().eq("id", inviteId);
  return { error: error?.message ?? null };
}
