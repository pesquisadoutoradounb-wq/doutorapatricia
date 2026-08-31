import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  renderCorpoConvite,
} from "../../supabase/functions/_shared/emailConvite";

const LINK = "https://ex.github.io/app/#/participar/abc-123";
const LINK_RECUSA = "https://ex.github.io/app/#/recusar/abc-123";

describe("escapeHtml", () => {
  it("escapa <, >, & e aspas", () => {
    expect(escapeHtml('a<b>&"c"')).toBe("a&lt;b&gt;&amp;&quot;c&quot;");
  });
});

describe("renderCorpoConvite", () => {
  it("substitui {{nome}} escapado", () => {
    expect(
      renderCorpoConvite("<p>Olá, {{nome}}.</p>", "Ana <b>", LINK, LINK_RECUSA),
    ).toBe("<p>Olá, Ana &lt;b&gt;.</p>");
  });

  it('nome vazio vira "participante"', () => {
    expect(renderCorpoConvite("{{nome}}", null, LINK, LINK_RECUSA)).toBe(
      "participante",
    );
  });

  it("{{link}} vira URL crua escapada (não mais <a>)", () => {
    const out = renderCorpoConvite(
      '<a href="{{link}}">{{link}}</a>',
      "Ana",
      LINK,
      LINK_RECUSA,
    );
    expect(out).toBe(`<a href="${LINK}">${LINK}</a>`);
    expect(out).not.toContain("<a href=\"<a");
  });

  it("{{link_recusa}} é substituído de forma independente", () => {
    expect(
      renderCorpoConvite(
        'part={{link}} recusa={{link_recusa}}',
        "Ana",
        LINK,
        LINK_RECUSA,
      ),
    ).toBe(`part=${LINK} recusa=${LINK_RECUSA}`);
  });

  it("todas as ocorrências de cada placeholder são trocadas", () => {
    expect(
      renderCorpoConvite("{{link}} {{link}}", "x", LINK, LINK_RECUSA),
    ).toBe(`${LINK} ${LINK}`);
  });

  it("texto sem placeholder fica inalterado", () => {
    expect(
      renderCorpoConvite("<p>sem nada</p>", "x", LINK, LINK_RECUSA),
    ).toBe("<p>sem nada</p>");
  });
});
