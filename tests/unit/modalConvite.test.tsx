import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalConvite } from "../../src/components/painel/ModalConvite";

function setup(props: Partial<Parameters<typeof ModalConvite>[0]> = {}) {
  const onFechar = vi.fn();
  const onCadastrar = vi.fn().mockResolvedValue({
    ok: true,
    resultado: { criados: 1, enviados: 1, erros: [] },
  });
  render(
    <ModalConvite
      aberto
      onFechar={onFechar}
      onCadastrar={onCadastrar}
      {...props}
    />,
  );
  return { onFechar, onCadastrar };
}

const enviarBtn = () =>
  screen.getByRole("button", { name: /cadastrar .*convite/i });

describe("ModalConvite", () => {
  it("fechado não renderiza nada", () => {
    const { container } = render(
      <ModalConvite aberto={false} onFechar={() => {}} onCadastrar={async () => ({ ok: true, resultado: { criados: 0, enviados: 0, erros: [] } })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("começa com o envio desabilitado (nenhum e-mail)", () => {
    setup();
    expect(enviarBtn()).toBeDisabled();
  });

  it("e-mail inválido bloqueia o envio e mostra erro", async () => {
    const u = userEvent.setup();
    setup();
    await u.type(screen.getByPlaceholderText("maria@exemplo.com"), "nao-eh-email");
    expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument();
    expect(enviarBtn()).toBeDisabled();
  });

  it("e-mail válido habilita e envia o payload normalizado", async () => {
    const u = userEvent.setup();
    const { onCadastrar } = setup();
    await u.type(
      screen.getByPlaceholderText("maria@exemplo.com"),
      "  MARIA@Exemplo.com ",
    );
    await u.type(screen.getByPlaceholderText("opcional"), " Maria ");
    expect(enviarBtn()).toBeEnabled();
    await u.click(enviarBtn());
    expect(onCadastrar).toHaveBeenCalledWith([
      { email: "maria@exemplo.com", nome: "Maria" },
    ]);
  });

  it("adiciona e remove linhas; detecta e-mail repetido", async () => {
    const u = userEvent.setup();
    setup();
    await u.type(screen.getByPlaceholderText("maria@exemplo.com"), "a@x.com");
    await u.click(screen.getByRole("button", { name: /adicionar outro/i }));

    const emails = screen.getAllByPlaceholderText("maria@exemplo.com");
    expect(emails).toHaveLength(2);
    await u.type(emails[1], "a@x.com");
    expect(screen.getByText(/repetido/i)).toBeInTheDocument();
    expect(enviarBtn()).toBeDisabled();

    await u.click(screen.getByRole("button", { name: /remover linha 2/i }));
    expect(screen.getAllByPlaceholderText("maria@exemplo.com")).toHaveLength(1);
    expect(enviarBtn()).toBeEnabled();
  });

  it("pré-preenche a partir de linhasIniciais (CSV)", () => {
    setup({
      linhasIniciais: [
        { email: "x@y.com", nome: "X" },
        { email: "z@y.com", nome: null },
      ],
    });
    const emails = screen.getAllByPlaceholderText("maria@exemplo.com") as HTMLInputElement[];
    expect(emails.map((e) => e.value)).toEqual(["x@y.com", "z@y.com"]);
  });

  it("fecha com recarregar=true quando não há falhas", async () => {
    const u = userEvent.setup();
    const { onFechar } = setup();
    await u.type(screen.getByPlaceholderText("maria@exemplo.com"), "a@x.com");
    await u.click(enviarBtn());
    expect(onFechar).toHaveBeenCalledWith(true);
  });

  it("mantém aberto e lista falhas parciais", async () => {
    const u = userEvent.setup();
    const onFechar = vi.fn();
    render(
      <ModalConvite
        aberto
        onFechar={onFechar}
        onCadastrar={async () => ({
          ok: true,
          resultado: {
            criados: 0,
            enviados: 0,
            erros: [{ email: "a@x.com", motivo: "já existe" }],
          },
        })}
      />,
    );
    await u.type(screen.getByPlaceholderText("maria@exemplo.com"), "a@x.com");
    await u.click(enviarBtn());
    expect(onFechar).not.toHaveBeenCalled();
    const caixa = screen.getByText(/falharam/i).closest("div")!;
    expect(within(caixa).getByText(/já existe/)).toBeInTheDocument();
  });
});
