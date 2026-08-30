import { describe, expect, it } from "vitest";
import { parseCsvConvites } from "../../src/lib/csvConvites";

describe("parseCsvConvites", () => {
  it("um e-mail por linha", () => {
    const r = parseCsvConvites("maria@ex.com\njoao@ex.com\n");
    expect(r.linhas).toEqual([
      { email: "maria@ex.com", nome: null },
      { email: "joao@ex.com", nome: null },
    ]);
    expect(r.erros).toEqual([]);
  });

  it("email,nome com vírgula", () => {
    const r = parseCsvConvites("maria@ex.com, Maria Silva\njoao@ex.com,João");
    expect(r.linhas).toEqual([
      { email: "maria@ex.com", nome: "Maria Silva" },
      { email: "joao@ex.com", nome: "João" },
    ]);
  });

  it("email;nome (Excel BR)", () => {
    const r = parseCsvConvites("maria@ex.com;Maria\njoao@ex.com;João");
    expect(r.linhas.map((l) => l.nome)).toEqual(["Maria", "João"]);
  });

  it("ignora cabeçalho", () => {
    const r = parseCsvConvites("email,nome\nmaria@ex.com,Maria");
    expect(r.linhas).toEqual([{ email: "maria@ex.com", nome: "Maria" }]);
  });

  it("nome entre aspas com vírgula", () => {
    const r = parseCsvConvites('maria@ex.com,"Silva, Maria"');
    expect(r.linhas[0].nome).toBe("Silva, Maria");
  });

  it("e-mail inválido e repetido viram erros; válidos seguem", () => {
    const r = parseCsvConvites(
      "ana@ex.com\nchico arroba ex.com\nmaria@ex.com\nmaria@ex.com",
    );
    expect(r.linhas.map((l) => l.email)).toEqual(["ana@ex.com", "maria@ex.com"]);
    expect(r.erros).toHaveLength(2);
    expect(r.erros[0].motivo).toMatch(/inválido/);
    expect(r.erros[1].motivo).toMatch(/repetido/);
  });

  it("primeira linha sem @ é tratada como cabeçalho e ignorada", () => {
    const r = parseCsvConvites("lista de contatos\nmaria@ex.com");
    expect(r.linhas).toEqual([{ email: "maria@ex.com", nome: null }]);
    expect(r.erros).toEqual([]);
  });

  it("normaliza o e-mail para minúsculas", () => {
    expect(parseCsvConvites("MARIA@EX.COM").linhas[0].email).toBe("maria@ex.com");
  });

  it("entrada vazia", () => {
    expect(parseCsvConvites("   \n  ")).toEqual({ linhas: [], erros: [] });
  });
});
