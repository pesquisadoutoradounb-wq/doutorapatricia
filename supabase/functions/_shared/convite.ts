// O especificador `jsr:` só resolve no Deno (runtime das Edge Functions). Na
// compilação dos testes (vitest/tsc) o import de tipo é apagado — suprimimos o
// TS2307 aqui para que `validarConvite` possa ser testado isoladamente.
// @ts-ignore -- Deno-only
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Convite {
  id: string;
  status: string;
  modo: "piloto" | "producao";
  expira_em: string | null;
  primeiro_acesso_em: string | null;
  study_id: string;
}

export type ValidacaoConvite =
  | { ok: true; convite: Convite }
  | { ok: false; status: 400 | 404 | 410 }
  | { ok: false; status: 409; motivo: "concluido" | "recusado" };

/**
 * Valida um token de convite usando o cliente admin (service_role).
 * Não expõe e-mail/nome — só o mínimo para conduzir o fluxo.
 */
export async function validarConvite(
  admin: SupabaseClient,
  token: unknown,
): Promise<ValidacaoConvite> {
  if (typeof token !== "string" || !UUID_RE.test(token)) {
    return { ok: false, status: 400 };
  }

  const { data, error } = await admin
    .from("invites")
    .select("id, status, modo, expira_em, primeiro_acesso_em, study_id")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return { ok: false, status: 404 };

  const convite = data as Convite;

  if (convite.status === "concluido") {
    return { ok: false, status: 409, motivo: "concluido" };
  }
  if (convite.status === "recusou") {
    return { ok: false, status: 409, motivo: "recusado" };
  }

  // A expiração vale apenas para quem AINDA NÃO começou. Se o participante já
  // acessou o link, ele pode continuar de onde parou em qualquer dispositivo,
  // mesmo depois da data de expiração — o link é a credencial pessoal dele.
  const jaComecou = Boolean(convite.primeiro_acesso_em);
  const expirado =
    convite.status === "expirado" ||
    (convite.expira_em && new Date(convite.expira_em).getTime() < Date.now());

  if (expirado && !jaComecou) {
    if (convite.status !== "expirado") {
      await admin.from("invites").update({ status: "expirado" }).eq("id", convite.id);
    }
    return { ok: false, status: 410 };
  }

  return { ok: true, convite };
}

/** IP do chamador a partir dos cabeçalhos de proxy. */
export function ipDoRequest(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
