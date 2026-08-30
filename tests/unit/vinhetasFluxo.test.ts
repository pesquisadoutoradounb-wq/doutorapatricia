import { describe, expect, it } from "vitest";
import { proximaPosicao, type ItemOrdem } from "../../src/lib/vinhetas/vinhetasFluxo";

// Ordem sorteada: a posição 1 é a vinheta 7, a 2 é a 3, etc.
const ordem: ItemOrdem[] = [
  { vignette_id: 7, posicao: 1 },
  { vignette_id: 3, posicao: 2 },
  { vignette_id: 10, posicao: 3 },
  { vignette_id: 1, posicao: 4 },
];

describe("proximaPosicao", () => {
  it("nada concluído → posição 1 (na ordem sorteada, não por id)", () => {
    const r = proximaPosicao(ordem, []);
    expect(r).toEqual({ terminou: false, posicao: 1, vignetteId: 7 });
  });

  it("primeira concluída → segunda da ordem", () => {
    const r = proximaPosicao(ordem, [7]);
    expect(r).toEqual({ terminou: false, posicao: 2, vignetteId: 3 });
  });

  it("buraco no meio volta para a vinheta pendente mais adiantada", () => {
    const r = proximaPosicao(ordem, [7, 10]); // 3 ainda falta
    expect(r).toEqual({ terminou: false, posicao: 2, vignetteId: 3 });
  });

  it("todas concluídas → terminou", () => {
    const r = proximaPosicao(ordem, [7, 3, 10, 1]);
    expect(r.terminou).toBe(true);
    expect(r.vignetteId).toBeNull();
  });

  it("aceita entrada fora de ordem", () => {
    const embaralhada = [...ordem].reverse();
    expect(proximaPosicao(embaralhada, [7]).vignetteId).toBe(3);
  });
});
