import { describe, expect, it } from "vitest";
import {
  ETAPAS,
  ETAPAS_TERMINAIS,
  ehEtapaTerminal,
  rotaDaEtapa,
} from "../../src/lib/participantSession";

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
    expect(rotaDaEtapa("informacoes")).toBe("/participar/informacoes");
    expect(rotaDaEtapa("tcle")).toBe("/participar/tcle");
    expect(rotaDaEtapa("ysq")).toBe("/participar/etapa/ysq");
    expect(rotaDaEtapa("sociodemografico")).toBe("/participar/etapa/sociodemografico");
  });

  it("encaminha 'encerramento' e 'concluido' para a tela de encerramento", () => {
    expect(rotaDaEtapa("encerramento")).toBe("/participar/encerramento");
    expect(rotaDaEtapa("concluido")).toBe("/participar/encerramento");
  });

  it("tem rotas dedicadas para os estados terminais", () => {
    expect(rotaDaEtapa("inelegivel")).toBe("/participar/inelegivel");
    expect(rotaDaEtapa("interrompido")).toBe("/participar/interrompido");
  });

  it("reconhece etapas terminais e não as inclui na sequência feliz", () => {
    expect(ETAPAS_TERMINAIS).toEqual(["inelegivel", "interrompido"]);
    expect(ehEtapaTerminal("inelegivel")).toBe(true);
    expect(ehEtapaTerminal("interrompido")).toBe(true);
    expect(ehEtapaTerminal("ysq")).toBe(false);
    for (const t of ETAPAS_TERMINAIS) {
      expect((ETAPAS as readonly string[]).includes(t)).toBe(false);
    }
  });
});
