import { describe, expect, it } from "vitest";
import { nomeArquivo, paraCsv } from "../../src/lib/exportacao";

describe("paraCsv", () => {
  it("cabeçalho a partir das chaves; ordem estável", () => {
    const csv = paraCsv([
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4");
  });

  it("inclui chaves que só aparecem em linhas seguintes", () => {
    const csv = paraCsv([{ a: 1 }, { a: 2, b: 9 }]);
    expect(csv.split("\r\n")[0]).toBe("a,b");
    expect(csv.split("\r\n")[1]).toBe("1,");
  });

  it("escapa vírgula, aspas e quebra de linha", () => {
    const csv = paraCsv([{ x: 'a,b', y: 'ele disse "oi"', z: "linha1\nlinha2" }]);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"ele disse ""oi"""');
    expect(csv).toContain('"linha1\nlinha2"');
  });

  it("null vira vazio; array/objeto viram JSON", () => {
    const csv = paraCsv([{ a: null, b: [1, 2], c: { k: 1 } }]);
    const linha = csv.split("\r\n")[1];
    expect(linha).toBe(',"[1,2]","{""k"":1}"');
  });

  it("lista vazia → string vazia", () => {
    expect(paraCsv([])).toBe("");
  });
});

describe("nomeArquivo", () => {
  it("inclui conjunto, data e extensão", () => {
    expect(nomeArquivo("ysq", "csv")).toMatch(
      /^estudo1_ysq_\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });
});
