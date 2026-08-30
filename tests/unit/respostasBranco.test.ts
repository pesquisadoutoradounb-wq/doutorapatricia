import { describe, expect, it } from "vitest";
import {
  contarEmBranco,
  decisaoPorBranco,
  estaEmBranco,
} from "../../src/lib/instrumentos/respostasBranco";

describe("estaEmBranco", () => {
  it("considera em branco: null, undefined, string vazia, array vazio, NaN", () => {
    expect(estaEmBranco(null)).toBe(true);
    expect(estaEmBranco(undefined)).toBe(true);
    expect(estaEmBranco("")).toBe(true);
    expect(estaEmBranco("   ")).toBe(true);
    expect(estaEmBranco([])).toBe(true);
    expect(estaEmBranco(Number.NaN)).toBe(true);
  });

  it("não considera em branco: 0, texto, array não vazio", () => {
    expect(estaEmBranco(0)).toBe(false);
    expect(estaEmBranco("nao")).toBe(false);
    expect(estaEmBranco(["ansiedade"])).toBe(false);
  });
});

describe("decisaoPorBranco", () => {
  it("0 em branco → seguir", () => {
    expect(decisaoPorBranco(0)).toBe("seguir");
    expect(decisaoPorBranco(contarEmBranco(["sim", 3, ["x"]]))).toBe("seguir");
  });

  it("1 em branco → avisar", () => {
    expect(decisaoPorBranco(1)).toBe("avisar");
    expect(decisaoPorBranco(contarEmBranco(["sim", null, 4]))).toBe("avisar");
  });

  it("2 ou mais em branco → modal", () => {
    expect(decisaoPorBranco(2)).toBe("modal");
    expect(decisaoPorBranco(9)).toBe("modal");
    expect(decisaoPorBranco(contarEmBranco([null, "", 5, undefined]))).toBe("modal");
  });
});
