import { describe, expect, it } from "vitest";
import { config, linkDeConvite } from "../../src/lib/config";

describe("config", () => {
  it("expõe as rotas separadas de participante e admin", () => {
    expect(config.rotas.participante).toBe("/participar");
    expect(config.rotas.admin).toBe("/admin");
  });

  it("monta o link de convite com hash routing e o token", () => {
    const url = linkDeConvite("abc-123");
    expect(url).toBe(
      "https://pesquisadoutoradounb-wq.github.io/doutorapatricia/#/participar/abc-123",
    );
  });

  it("não carrega nenhum texto de instrumento", () => {
    const serial = JSON.stringify(config).toLowerCase();
    expect(serial).not.toContain("imagine a seguinte");
    expect(serial).not.toContain("consentimento livre");
  });
});
