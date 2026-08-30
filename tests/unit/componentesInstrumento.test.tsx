import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalAbandono } from "../../src/components/participar/ModalAbandono";
import {
  EscalaLikert,
  LegendaEscala,
} from "../../src/components/participar/EscalaLikert";

const PONTOS = [
  { valor: 1, rotulo: "Muito pouco ou nada" },
  { valor: 2, rotulo: "Um pouco" },
  { valor: 3, rotulo: "Moderadamente" },
];

describe("ModalAbandono", () => {
  it("não renderiza nada quando fechado", () => {
    const { container } = render(
      <ModalAbandono aberto={false} onCancelar={() => {}} onConfirmar={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o texto da pesquisadora e aciona os callbacks", async () => {
    const onCancelar = vi.fn();
    const onConfirmar = vi.fn();
    render(
      <ModalAbandono aberto onCancelar={onCancelar} onConfirmar={onConfirmar} />,
    );
    expect(
      screen.getByText(/não respondeu as questões anteriores/i),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^cancelar$/i }));
    expect(onCancelar).toHaveBeenCalledOnce();
    await userEvent.click(
      screen.getByRole("button", { name: /cancelar minha participação/i }),
    );
    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it("é um diálogo modal acessível", () => {
    render(<ModalAbandono aberto onCancelar={() => {}} onConfirmar={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});

describe("EscalaLikert", () => {
  it("marca o ponto escolhido e propaga o valor", async () => {
    const onChange = vi.fn();
    render(
      <EscalaLikert
        nome="panas-1"
        enunciado="Interessado"
        pontos={PONTOS}
        valor={null}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /2 — um pouco/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("realça o item quando emBranco", () => {
    const { container } = render(
      <EscalaLikert
        nome="ysq-5"
        enunciado="Item 5"
        pontos={PONTOS}
        valor={null}
        onChange={() => {}}
        emBranco
      />,
    );
    expect(container.querySelector(".likert--branco")).not.toBeNull();
  });
});

describe("LegendaEscala", () => {
  it("lista todos os pontos com número e rótulo", () => {
    render(<LegendaEscala pontos={PONTOS} />);
    expect(screen.getByText("Moderadamente")).toBeInTheDocument();
    expect(screen.getAllByRole("term")).toHaveLength(3);
  });
});
