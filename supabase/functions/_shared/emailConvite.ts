// Renderização do corpo HTML do e-mail de convite (documento `convite_email`).
//
// Extraído de `send-invite/index.ts` para ser testável (o index tem `Deno.serve`
// e não é importável pelo vitest). Mesmo padrão de `_shared/brevoEventos.ts`.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Substitui os placeholders do corpo do e-mail.
 *
 *  - `{{nome}}`        → nome do convidado (ou "participante"), escapado
 *  - `{{link}}`        → URL individual de participação, escapada (URL crua:
 *                        o template usa em `href="..."` e como texto p/ copiar)
 *  - `{{link_recusa}}` → URL individual de recusa, escapada
 *
 * Mudança de contrato (0015): `{{link}}` deixou de virar `<a>` automaticamente;
 * o HTML do documento controla o hyperlink.
 */
export function renderCorpoConvite(
  html: string,
  nome: string | null,
  link: string,
  linkRecusa: string,
): string {
  return html
    .split("{{nome}}").join(escapeHtml(nome || "participante"))
    .split("{{link}}").join(escapeHtml(link))
    .split("{{link_recusa}}").join(escapeHtml(linkRecusa));
}
