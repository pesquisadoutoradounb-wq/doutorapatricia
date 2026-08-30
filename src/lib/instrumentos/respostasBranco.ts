/**
 * Verificação de respostas em branco (PERGUNTAR 19). Não se força resposta: ao
 * tentar avançar, contam-se os itens aplicáveis sem resposta e decide-se:
 *   0 em branco  → seguir
 *   1 em branco  → avisar (realce inline, mas pode seguir)
 *   ≥2 em branco → abrir o modal de abandono
 *
 * Vale para o sociodemográfico, cada bloco do YSQ e o PANAS.
 */
export type ValorItem = string | number | string[] | null | undefined;

export function estaEmBranco(v: ValorItem): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "number") return Number.isNaN(v);
  return false;
}

export function contarEmBranco(valores: ValorItem[]): number {
  return valores.reduce<number>((n, v) => n + (estaEmBranco(v) ? 1 : 0), 0);
}

export type DecisaoBranco = "seguir" | "avisar" | "modal";

export const LIMITE_MODAL_BRANCO = 2;

export function decisaoPorBranco(quantidade: number): DecisaoBranco {
  if (quantidade <= 0) return "seguir";
  if (quantidade < LIMITE_MODAL_BRANCO) return "avisar";
  return "modal";
}

/** Texto do modal de abandono — fornecido pela pesquisadora (PERGUNTAR 19). */
export const TEXTO_MODAL_ABANDONO =
  "Verificamos que você não respondeu as questões anteriores. Deseja " +
  "interromper sua participação na pesquisa?";
