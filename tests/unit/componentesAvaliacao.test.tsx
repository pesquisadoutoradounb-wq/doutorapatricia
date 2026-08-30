import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EscalaNumerica } from "../../src/components/participar/EscalaNumerica";
import { MatrizEmocoes } from "../../src/components/participar/MatrizEmocoes";
import { EMOCOES_Q3 } from "../../src/lib/vinhetas/avaliacaoPosImaginacao";

describe("EscalaNumerica", () => {
  it("−5..+5 tem 11 pontos e propaga negativos e zero", async () => {
    const onChange = vi.fn();
    render(
      <EscalaNumerica
        nome="q4"
        min={-5}
        max={5}
        valor={null}
        onChange={onChange}
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    await userEvent.click(screen.getByRole("radio", { name: "-5" }));
    expect(onChange).toHaveBeenLastCalledWith(-5);
    await userEvent.click(screen.getByRole("radio", { name: "0" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("0–10 tem 11 pontos", () => {
    render(<EscalaNumerica nome="q1" min={0} max={10} valor={3} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(11);
  });
});

describe("MatrizEmocoes", () => {
  it("uma linha por emoção; altera só a linha tocada", async () => {
    const onChange = vi.fn();
    render(
      <MatrizEmocoes
        nome="q3m"
        linhas={EMOCOES_Q3}
        valor={{ ansiedade: 2 }}
        onChange={onChange}
      />,
    );
    // 8 emoções × 11 pontos
    expect(screen.getAllByRole("radio")).toHaveLength(EMOCOES_Q3.length * 11);
    const grupoTristeza = screen.getByRole("radiogroup", { name: "q3m-tristeza" });
    await userEvent.click(within(grupoTristeza).getByRole("radio", { name: "5" }));
    expect(onChange).toHaveBeenLastCalledWith({ ansiedade: 2, tristeza: 5 });
  });
});
