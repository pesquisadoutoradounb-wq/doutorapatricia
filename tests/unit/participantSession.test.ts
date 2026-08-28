import { describe, expect, it } from "vitest";
import { ETAPAS, rotaDaEtapa } from "../../src/lib/participantSession";

describe("participantSession", () => {
  it("tem as etapas na ordem obrigatória do protocolo", () => {
    expect(ETAPAS).toEqual([
      "informacoes",
      "tcle",
      "sociodemografico",
      "ysq",
      "panas",
      "instrucoes",
      "vinhetas",
      "encerramento",
      "concluido",
    ]);
  });

  it("mapeia etapas para rotas dentro de /participar", () => {
    expect(rotaDaEtapa("tcle")).toBe("/participar/etapa/tcle");
    expect(rotaDaEtapa("ysq")).toBe("/participar/etapa/ysq");
  });

  it("encaminha 'encerramento' e 'concluido' para a tela de encerramento", () => {
    expect(rotaDaEtapa("encerramento")).toBe("/participar/encerramento");
    expect(rotaDaEtapa("concluido")).toBe("/participar/encerramento");
  });
});
