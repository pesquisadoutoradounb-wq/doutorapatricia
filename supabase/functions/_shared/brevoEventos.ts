// Mapeamento dos eventos de webhook do Brevo para o enum `email_event_type`.
// Sem dependências externas — reutilizado nos testes (vitest).

export type TipoEventoEmail =
  | "enviado"
  | "entregue"
  | "aberto"
  | "clicado"
  | "bounce"
  | "spam"
  | "outro";

const MAPA: Record<string, TipoEventoEmail> = {
  request: "enviado",
  sent: "enviado",
  delivered: "entregue",
  opened: "aberto",
  unique_opened: "aberto",
  proxy_open: "aberto",
  click: "clicado",
  hard_bounce: "bounce",
  soft_bounce: "bounce",
  blocked: "bounce",
  invalid_email: "bounce",
  deferred: "outro",
  error: "outro",
  spam: "spam",
  unsubscribed: "spam",
  list_addition: "outro",
};

export function tipoEventoBrevo(evento: unknown): TipoEventoEmail {
  if (typeof evento !== "string") return "outro";
  return MAPA[evento.trim().toLowerCase()] ?? "outro";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Extrai o invite_id da tag enviada em `send-invite` (payload.tags[0]). */
export function inviteIdDaTag(payload: Record<string, unknown>): string | null {
  const tags = payload["tags"];
  const cand = Array.isArray(tags) ? tags[0] : tags;
  return typeof cand === "string" && UUID_RE.test(cand) ? cand : null;
}
