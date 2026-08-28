// Edge Function: send-invite  (STUB — implementação completa no sub-projeto E)
//
// Recebe do painel admin uma lista de e-mails, cria registros em `invites` e
// dispara os convites via API do Brevo (template HTML). A BREVO_API_KEY vive
// como secret da Supabase e NUNCA é exposta ao cliente.
//
// Já aplica a fronteira de segurança: só admin com permissão de escrita passa.

import { respostaJson, corsHeaders } from "../_shared/cors.ts";
import { supabaseComoUsuario } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return respostaJson({ erro: "metodo_nao_permitido" }, 405, origin);

  const cliente = supabaseComoUsuario(req);
  const { data: userData } = await cliente.auth.getUser();
  if (!userData.user) return respostaJson({ erro: "nao_autenticado" }, 401, origin);

  const { data: pode } = await cliente.rpc("admin_pode_escrever");
  if (!pode) return respostaJson({ erro: "sem_permissao" }, 403, origin);

  return respostaJson(
    { erro: "nao_implementado", detalhe: "send-invite entra no sub-projeto E" },
    501,
    origin,
  );
});
