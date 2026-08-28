import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Isola o roteamento de qualquer rede: o cliente Supabase é substituído.
vi.mock("../../src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      signInAnonymously: vi.fn(() => new Promise(() => {})),
      refreshSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    // A chamada de rede fica pendente: a tela deve permanecer em "verificando",
    // nunca cair para erro técnico.
    functions: { invoke: vi.fn(() => new Promise(() => {})) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
  participantIdAtual: vi.fn().mockResolvedValue(null),
}));

import { App } from "../../src/App";

beforeEach(() => {
  window.location.hash = "";
});

describe("separação de rotas participante × admin", () => {
  it("a raiz explica que o acesso é por convite e não expõe o painel como fluxo", async () => {
    window.location.hash = "#/";
    render(<App />);
    expect(
      await screen.findByText(/link de convite individual/i),
    ).toBeInTheDocument();
  });

  it("/participar/:token mostra estado de verificação, nunca erro técnico", async () => {
    window.location.hash = "#/participar/token-de-teste";
    render(<App />);
    expect(await screen.findByText(/verificando seu convite/i)).toBeInTheDocument();
  });

  it("o rodapé de desconforto aparece nas telas do participante", async () => {
    window.location.hash = "#/participar/token-de-teste";
    render(<App />);
    expect(
      await screen.findByRole("link", { name: /desconforto durante a pesquisa/i }),
    ).toBeInTheDocument();
  });

  it("/admin/login mostra a área restrita da equipe", async () => {
    window.location.hash = "#/admin/login";
    render(<App />);
    expect(await screen.findByText(/acesso da equipe/i)).toBeInTheDocument();
    expect(screen.getByText(/participantes não usam esta tela/i)).toBeInTheDocument();
  });
});
