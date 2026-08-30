import { describe, expect, it } from "vitest";
import {
  marcaBranco,
  matrizEmBranco,
  normalizarRespostas,
  questoesAplicaveis,
  AVALIACAO_POS_IMAGINACAO,
} from "../../src/lib/vinhetas/avaliacaoPosImaginacao";

const campos = (r: Parameters<typeof questoesAplicaveis>[0]) =>
  questoesAplicaveis(r).map((q) => q.campo);

describe("desvios da avaliação pós-imaginação", () => {
  it("Q1 = 0 → só aparecem Q1, Q7 e Q12", () => {
    expect(campos({ q1_imersao: 0 })).toEqual([
      "q1_imersao",
      "q7_imagem_espontanea",
      "q12_tendencia_aberta",
      "q12_matriz",
    ]);
  });

  it("Q1 > 0 → aparecem Q2–Q6 (matriz Q3b só com Q3 > 0)", () => {
    const semMatriz = campos({ q1_imersao: 7, q3_intensidade: 0 });
    expect(semMatriz).toContain("q2_emocao_aberta");
    expect(semMatriz).toContain("q4_valencia_emocional");
    expect(semMatriz).not.toContain("q3_matriz");

    const comMatriz = campos({ q1_imersao: 7, q3_intensidade: 4 });
    expect(comMatriz).toContain("q3_matriz");
  });

  it("Q7 = 'sim' → aparecem Q8–Q11; 'nao'/'nao_tenho_certeza' → não", () => {
    expect(campos({ q1_imersao: 5, q7_imagem_espontanea: "sim" })).toContain(
      "q8_vividez",
    );
    for (const v of ["nao", "nao_tenho_certeza"] as const) {
      const cs = campos({ q1_imersao: 5, q7_imagem_espontanea: v });
      expect(cs).not.toContain("q8_vividez");
      expect(cs).not.toContain("q11_conteudo_imagem");
      expect(cs).toContain("q12_matriz");
    }
  });

  it("Q1 e Q7 e Q12 aparecem sempre", () => {
    const cs = campos({});
    expect(cs).toEqual([
      "q1_imersao",
      "q7_imagem_espontanea",
      "q12_tendencia_aberta",
      "q12_matriz",
    ]);
  });
});

describe("normalizarRespostas", () => {
  it("limpa Q2–Q6 quando Q1 volta a 0", () => {
    const r = normalizarRespostas({
      q1_imersao: 0,
      q2_emocao_aberta: "medo",
      q5_desconforto: 8,
    });
    expect(r.q2_emocao_aberta).toBeNull();
    expect(r.q5_desconforto).toBeNull();
  });

  it("limpa Q8–Q11 quando Q7 deixa de ser 'sim'", () => {
    const r = normalizarRespostas({
      q7_imagem_espontanea: "nao",
      q8_vividez: 6,
      q11_conteudo_imagem: "uma porta",
    });
    expect(r.q8_vividez).toBeNull();
    expect(r.q11_conteudo_imagem).toBeNull();
  });

  it("limpa o texto de 'outra' quando a categoria muda", () => {
    const r = normalizarRespostas({
      q1_imersao: 5,
      q2_emocao_categoria: "medo",
      q2_emocao_outra: "saudade",
    });
    expect(r.q2_emocao_outra).toBeNull();
  });
});

describe("matrizEmBranco / marcaBranco", () => {
  it("matriz vazia ou sem valores numéricos → em branco", () => {
    expect(matrizEmBranco(null)).toBe(true);
    expect(matrizEmBranco({})).toBe(true);
    expect(matrizEmBranco({ outra: { rotulo: "x", valor: undefined } })).toBe(true);
  });

  it("matriz com pelo menos um valor → preenchida", () => {
    expect(matrizEmBranco({ ansiedade: 0 })).toBe(false);
    expect(matrizEmBranco({ outra: { rotulo: "x", valor: 3 } })).toBe(false);
  });

  it("escala aceita 0 e negativos como resposta (não em branco)", () => {
    const q4 = AVALIACAO_POS_IMAGINACAO.find((q) => q.campo === "q4_valencia_emocional")!;
    expect(marcaBranco(q4, 0)).toBe(1);
    expect(marcaBranco(q4, -5)).toBe(1);
    expect(marcaBranco(q4, null)).toBeNull();
  });

  it("texto vazio conta como em branco", () => {
    const q6 = AVALIACAO_POS_IMAGINACAO.find((q) => q.campo === "q6_pensamento_automatico")!;
    expect(marcaBranco(q6, "   ")).toBeNull();
    expect(marcaBranco(q6, "nenhum")).toBe(1);
  });
});
