import { describe, expect, it } from "vitest";
import {
  DOMINIOS_YSQ,
  ESQUEMAS_YSQ,
  escorePanas,
  escoreYsq,
  itensDoEsquema,
  mapaDeRespostas,
} from "../../src/lib/pontuacao";

describe("YSQ — estrutura", () => {
  it("são 18 esquemas e 5 domínios", () => {
    expect(ESQUEMAS_YSQ).toHaveLength(18);
    expect(DOMINIOS_YSQ).toHaveLength(5);
  });

  it("itensDoEsquema segue a fórmula {s, s+18, s+36, s+54, s+72}", () => {
    expect(itensDoEsquema(1)).toEqual([1, 19, 37, 55, 73]);
    expect(itensDoEsquema(18)).toEqual([18, 36, 54, 72, 90]);
  });

  it("domínios conforme a folha: D3 = esquemas 14 e 15", () => {
    const d3 = ESQUEMAS_YSQ.filter((e) => e.dominio === 3).map((e) => e.indice);
    expect(d3).toEqual([14, 15]);
    const d4 = ESQUEMAS_YSQ.filter((e) => e.dominio === 4).map((e) => e.indice);
    expect(d4).toEqual([10, 11, 16]);
  });
});

describe("escoreYsq", () => {
  it("soma e média por esquema; item em branco não entra na média", () => {
    // esquema 1 = itens 1,19,37,55,73
    const v = new Map<number, number>([
      [1, 6],
      [19, 4],
      [37, 2],
      [55, 3],
      // 73 em branco
    ]);
    const e = escoreYsq(v).esquemas.find((x) => x.indice === 1)!;
    expect(e.total).toBe(15);
    expect(e.respondidos).toBe(4);
    expect(e.media).toBe(3.75);
  });

  it("esquema sem nenhuma resposta → media null", () => {
    const e = escoreYsq(new Map()).esquemas[0];
    expect(e.total).toBe(0);
    expect(e.media).toBeNull();
  });
});

describe("escorePanas", () => {
  it("PA = soma dos itens 1–9, NA = soma dos 10–19", () => {
    const v = new Map<number, number>();
    for (let i = 1; i <= 9; i++) v.set(i, 3); // PA total 27
    for (let i = 10; i <= 19; i++) v.set(i, 2); // NA total 20
    const e = escorePanas(v);
    expect(e.paTotal).toBe(27);
    expect(e.naTotal).toBe(20);
    expect(e.paMedia).toBe(3);
    expect(e.naMedia).toBe(2);
    expect(e.paRespondidos).toBe(9);
    expect(e.naRespondidos).toBe(10);
  });

  it("respostas parciais", () => {
    const e = escorePanas(new Map([[1, 5], [2, 5]]));
    expect(e.paTotal).toBe(10);
    expect(e.paRespondidos).toBe(2);
    expect(e.naTotal).toBe(0);
    expect(e.naMedia).toBeNull();
  });
});

describe("mapaDeRespostas", () => {
  it("agrupa linhas item-a-item por participante", () => {
    const m = mapaDeRespostas([
      { participant_id: "a", item: 1, valor: 4 },
      { participant_id: "a", item: 2, valor: 5 },
      { participant_id: "b", item: 1, valor: 1 },
    ]);
    expect(m.get("a")!.get(2)).toBe(5);
    expect(m.get("b")!.size).toBe(1);
  });
});
