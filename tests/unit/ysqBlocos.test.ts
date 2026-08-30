import { describe, expect, it } from "vitest";
import {
  TOTAL_BLOCOS_YSQ,
  blocoDoItem,
  itensDoBloco,
  primeiroBlocoIncompleto,
  ysqCompleto,
} from "../../src/lib/instrumentos/ysqBlocos";

describe("blocos do YSQ-S3", () => {
  it("são 9 blocos de 10 itens", () => {
    expect(TOTAL_BLOCOS_YSQ).toBe(9);
    expect(itensDoBloco(1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(itensDoBloco(9)).toEqual([81, 82, 83, 84, 85, 86, 87, 88, 89, 90]);
  });

  it("blocoDoItem mapeia item → bloco", () => {
    expect(blocoDoItem(1)).toBe(1);
    expect(blocoDoItem(10)).toBe(1);
    expect(blocoDoItem(11)).toBe(2);
    expect(blocoDoItem(90)).toBe(9);
  });
});

describe("primeiroBlocoIncompleto", () => {
  it("sem nenhuma resposta → bloco 1", () => {
    expect(primeiroBlocoIncompleto([])).toBe(1);
  });

  it("bloco 1 completo, bloco 2 incompleto → bloco 2", () => {
    const respondidos = [...itensDoBloco(1), 11, 12];
    expect(primeiroBlocoIncompleto(respondidos)).toBe(2);
  });

  it("um buraco no meio → volta ao bloco do buraco", () => {
    const todos = Array.from({ length: 90 }, (_, i) => i + 1);
    const semItem45 = todos.filter((n) => n !== 45);
    expect(primeiroBlocoIncompleto(semItem45)).toBe(blocoDoItem(45));
  });

  it("todos os 90 respondidos → último bloco", () => {
    const todos = Array.from({ length: 90 }, (_, i) => i + 1);
    expect(primeiroBlocoIncompleto(todos)).toBe(9);
    expect(ysqCompleto(todos)).toBe(true);
  });

  it("aceita Set como entrada", () => {
    expect(primeiroBlocoIncompleto(new Set([1, 2, 3]))).toBe(1);
  });
});
