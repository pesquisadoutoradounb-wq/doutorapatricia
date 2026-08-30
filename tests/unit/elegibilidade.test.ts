import { describe, expect, it } from "vitest";
import { avaliarElegibilidade } from "../../src/lib/instrumentos/elegibilidade";
import type { RespostasSociodemografico } from "../../src/lib/instrumentos/sociodemografico";

const elegivel: RespostasSociodemografico = {
  q1_idade: 25,
  q15_acesso_internet: "sim",
  q17_dispositivo_audio: "sim",
  q18_compreende_portugues: "sim",
};

describe("avaliarElegibilidade", () => {
  it("aprova quem atende a todos os critérios", () => {
    const r = avaliarElegibilidade(elegivel);
    expect(r.elegivel).toBe(true);
    expect(r.motivos).toEqual([]);
  });

  it("18 anos é elegível; 17 não é", () => {
    expect(avaliarElegibilidade({ ...elegivel, q1_idade: 18 }).elegivel).toBe(true);
    const r = avaliarElegibilidade({ ...elegivel, q1_idade: 17 });
    expect(r.elegivel).toBe(false);
    expect(r.motivos).toContain("idade_menor_18");
  });

  it("reprova sem acesso à internet (Q15 = Não)", () => {
    const r = avaliarElegibilidade({ ...elegivel, q15_acesso_internet: "nao" });
    expect(r.motivos).toEqual(["sem_acesso_internet"]);
  });

  it("reprova dispositivo sem áudio (Q17 = Não), mas 'Não sei' não reprova", () => {
    expect(
      avaliarElegibilidade({ ...elegivel, q17_dispositivo_audio: "nao" }).motivos,
    ).toEqual(["dispositivo_sem_audio"]);
    expect(
      avaliarElegibilidade({ ...elegivel, q17_dispositivo_audio: "nao_sei" }).elegivel,
    ).toBe(true);
  });

  it("reprova quem não compreende português (Q18 = Não)", () => {
    const r = avaliarElegibilidade({ ...elegivel, q18_compreende_portugues: "nao" });
    expect(r.motivos).toEqual(["nao_compreende_portugues"]);
  });

  it("acumula todos os motivos aplicáveis", () => {
    const r = avaliarElegibilidade({
      q1_idade: 15,
      q15_acesso_internet: "nao",
      q17_dispositivo_audio: "nao",
      q18_compreende_portugues: "nao",
    });
    expect(r.elegivel).toBe(false);
    expect(r.motivos).toHaveLength(4);
  });

  it("idade ausente não gera motivo de idade (o formulário bloqueia antes)", () => {
    const r = avaliarElegibilidade({
      q15_acesso_internet: "sim",
      q17_dispositivo_audio: "sim",
      q18_compreende_portugues: "sim",
    });
    expect(r.motivos).not.toContain("idade_menor_18");
  });
});
