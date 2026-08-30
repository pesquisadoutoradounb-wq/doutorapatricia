/**
 * YSQ-S3 — 90 itens apresentados em blocos de 10 (9 telas curtas), com barra de
 * progresso. Autosave por item; a retomada cai no primeiro bloco incompleto.
 */
export const TOTAL_ITENS_YSQ = 90;
export const TAMANHO_BLOCO_YSQ = 10;
export const TOTAL_BLOCOS_YSQ = TOTAL_ITENS_YSQ / TAMANHO_BLOCO_YSQ; // 9

/** Números dos itens (1-indexados) de um bloco (1-indexado). */
export function itensDoBloco(bloco: number): number[] {
  const inicio = (bloco - 1) * TAMANHO_BLOCO_YSQ + 1;
  return Array.from({ length: TAMANHO_BLOCO_YSQ }, (_, i) => inicio + i);
}

export function blocoDoItem(item: number): number {
  return Math.floor((item - 1) / TAMANHO_BLOCO_YSQ) + 1;
}

/**
 * Primeiro bloco (1..9) que ainda tem algum item sem resposta. Se todos os 90
 * itens já foram respondidos, retorna o último bloco.
 */
export function primeiroBlocoIncompleto(respondidos: Iterable<number>): number {
  const set = respondidos instanceof Set ? respondidos : new Set(respondidos);
  for (let bloco = 1; bloco <= TOTAL_BLOCOS_YSQ; bloco++) {
    if (itensDoBloco(bloco).some((item) => !set.has(item))) return bloco;
  }
  return TOTAL_BLOCOS_YSQ;
}

export function ysqCompleto(respondidos: Iterable<number>): boolean {
  const set = respondidos instanceof Set ? respondidos : new Set(respondidos);
  for (let item = 1; item <= TOTAL_ITENS_YSQ; item++) {
    if (!set.has(item)) return false;
  }
  return true;
}
