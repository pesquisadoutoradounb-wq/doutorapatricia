import { describe, expect, it } from "vitest";
import {
  NAO_SEI_INFORMAR,
  PREFIRO_NAO_RESPONDER,
  SOCIODEMOGRAFICO,
  alternarSelecaoCheckbox,
  normalizarRespostas,
  questaoVisivel,
  questoesAplicaveis,
} from "../../src/lib/instrumentos/sociodemografico";
import { UF_FORA_DO_BRASIL } from "../../src/lib/instrumentos/ufs";

const q = (campo: string) =>
  SOCIODEMOGRAFICO.find((x) => x.campo === campo)!;

describe("visibilidade condicional", () => {
  it("q3 'Qual?' só aparece quando identidade de gênero = outra", () => {
    expect(questaoVisivel(q("q3_identidade_genero_outra"), {})).toBe(false);
    expect(
      questaoVisivel(q("q3_identidade_genero_outra"), {
        q3_identidade_genero: "outra",
      }),
    ).toBe(true);
  });

  it("q8 'País' só aparece com 'Resido fora do Brasil'", () => {
    expect(questaoVisivel(q("q8_pais"), { q8_uf: "SP" })).toBe(false);
    expect(questaoVisivel(q("q8_pais"), { q8_uf: UF_FORA_DO_BRASIL })).toBe(true);
  });

  it("q10 tempo só aparece quando psicoterapia atual = sim", () => {
    expect(questaoVisivel(q("q10_tempo"), { q10_psicoterapia_atual: "nao" })).toBe(
      false,
    );
    expect(questaoVisivel(q("q10_tempo"), { q10_psicoterapia_atual: "sim" })).toBe(
      true,
    );
  });

  it("q14 lista de diagnósticos só aparece quando q14 = sim", () => {
    expect(
      questaoVisivel(q("q14_diagnosticos"), { q14_diagnostico_informado: "nao" }),
    ).toBe(false);
    expect(
      questaoVisivel(q("q14_diagnosticos"), { q14_diagnostico_informado: "sim" }),
    ).toBe(true);
  });

  it("q14 'Qual?' (outro) só aparece quando 'outro' está marcado na lista", () => {
    expect(
      questaoVisivel(q("q14_diagnostico_outro"), {
        q14_diagnostico_informado: "sim",
        q14_diagnosticos: ["ansiedade"],
      }),
    ).toBe(false);
    expect(
      questaoVisivel(q("q14_diagnostico_outro"), {
        q14_diagnostico_informado: "sim",
        q14_diagnosticos: ["ansiedade", "outro"],
      }),
    ).toBe(true);
  });

  it("q16 'Qual?' só aparece quando 'outro' está entre os dispositivos", () => {
    expect(
      questaoVisivel(q("q16_dispositivo_outro"), { q16_dispositivos: ["smartphone"] }),
    ).toBe(false);
    expect(
      questaoVisivel(q("q16_dispositivo_outro"), {
        q16_dispositivos: ["smartphone", "outro"],
      }),
    ).toBe(true);
  });
});

describe("questoesAplicaveis", () => {
  it("exclui as condicionais quando o gatilho não está ativo", () => {
    const campos = questoesAplicaveis({}).map((x) => x.campo);
    expect(campos).toContain("q1_idade");
    expect(campos).not.toContain("q10_tempo");
    expect(campos).not.toContain("q13_medicacao_quais");
  });
});

describe("normalizarRespostas", () => {
  it("limpa a resposta de uma questão que deixou de estar visível", () => {
    const r = normalizarRespostas({
      q13_medicacao_atual: "nao",
      q13_medicacao_quais: "algum remédio",
    });
    expect(r.q13_medicacao_quais).toBeNull();
  });

  it("limpa a lista de diagnósticos quando q14 deixa de ser 'sim'", () => {
    const r = normalizarRespostas({
      q14_diagnostico_informado: "nao",
      q14_diagnosticos: ["ansiedade"],
    });
    expect(r.q14_diagnosticos).toEqual([]);
  });
});

describe("alternarSelecaoCheckbox — exclusividade da Q14", () => {
  const opcoes = q("q14_diagnosticos").opcoes!;

  it("marcar um diagnóstico comum acumula", () => {
    const r = alternarSelecaoCheckbox(["ansiedade"], "depressivo", opcoes);
    expect(r).toEqual(["ansiedade", "depressivo"]);
  });

  it("marcar 'Não sei informar' descarta os demais", () => {
    const r = alternarSelecaoCheckbox(
      ["ansiedade", "depressivo"],
      NAO_SEI_INFORMAR,
      opcoes,
    );
    expect(r).toEqual([NAO_SEI_INFORMAR]);
  });

  it("marcar um diagnóstico comum descarta uma opção exclusiva já marcada", () => {
    const r = alternarSelecaoCheckbox([PREFIRO_NAO_RESPONDER], "ansiedade", opcoes);
    expect(r).toEqual(["ansiedade"]);
  });

  it("clicar de novo numa opção marcada desmarca", () => {
    expect(alternarSelecaoCheckbox(["ansiedade"], "ansiedade", opcoes)).toEqual([]);
  });
});
