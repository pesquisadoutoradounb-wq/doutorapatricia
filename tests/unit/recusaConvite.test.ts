import { describe, expect, it, vi, beforeEach } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("../../src/lib/supabase", () => ({
  supabase: { functions: { invoke } },
}));

import { recusarConvite } from "../../src/lib/recusaConvite";

const TOKEN = "11111111-2222-4333-8444-555555555555";

beforeEach(() => invoke.mockReset());

describe("recusarConvite", () => {
  it("ok simples", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    expect(await recusarConvite(TOKEN)).toEqual({ ok: true, jaRecusado: false });
    expect(invoke).toHaveBeenCalledWith("recusar-convite", {
      body: { token: TOKEN },
    });
  });

  it("idempotente: ja_recusado", async () => {
    invoke.mockResolvedValue({
      data: { ok: true, ja_recusado: true },
      error: null,
    });
    expect(await recusarConvite(TOKEN)).toEqual({ ok: true, jaRecusado: true });
  });

  it("409 -> ja_concluido", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 409 } } });
    expect(await recusarConvite(TOKEN)).toEqual({
      ok: false,
      motivo: "ja_concluido",
    });
  });

  it("400/404 -> token_invalido", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    expect(await recusarConvite(TOKEN)).toEqual({
      ok: false,
      motivo: "token_invalido",
    });
  });

  it("erro sem status conhecido -> erro_rede", async () => {
    invoke.mockResolvedValue({ data: null, error: { name: "FunctionsFetchError" } });
    expect(await recusarConvite(TOKEN)).toEqual({ ok: false, motivo: "erro_rede" });
  });

  it("resposta sem ok -> erro_rede", async () => {
    invoke.mockResolvedValue({ data: { ok: false }, error: null });
    expect(await recusarConvite(TOKEN)).toEqual({ ok: false, motivo: "erro_rede" });
  });
});
