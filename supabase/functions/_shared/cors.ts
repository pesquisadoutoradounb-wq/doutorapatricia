// Cabeçalhos CORS. A aplicação roda em GitHub Pages (origem diferente do
// domínio *.supabase.co / *.functions.supabase.co).
const ORIGENS_PERMITIDAS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://pesquisadoutoradounb-wq.github.io",
];

export function corsHeaders(origin: string | null): Record<string, string> {
  const permitida =
    origin && ORIGENS_PERMITIDAS.includes(origin) ? origin : ORIGENS_PERMITIDAS[0];
  return {
    "Access-Control-Allow-Origin": permitida,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function respostaJson(
  corpo: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}
