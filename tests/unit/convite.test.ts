import { describe, expect, it } from "vitest";
// deno import (`jsr:`) só aparece como `import type` — apagado na compilação.
import { validarConvite } from "../../supabase/functions/_shared/convite";

const TOKEN = "11111111-2222-4333-8444-555555555555";

/** Fake mínimo do cliente admin: só o caminho que validarConvite exercita. */
function fakeAdmin(linha: Record<string, unknown> | null) {
  const updates: Record<string, unknown>[] = [];
  const admin = {
    _updates: updates,
    from() {
      return {
        select() {
          return this;
        },
        update(patch: Record<string, unknown>) {
          updates.push(patch);
          return { eq: async () => ({ error: null }) };
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({ data: linha, error: null }),
      };
    },
  };
  // deno-lint-ignore no-explicit-any
  return admin as any;
}

describe("validarConvite", () => {
  it("token não-UUID -> 400", async () => {
    expect(await validarConvite(fakeAdmin(null), "xxx")).toEqual({
      ok: false,
      status: 400,
    });
  });

  it("convite inexistente -> 404", async () => {
    expect(await validarConvite(fakeAdmin(null), TOKEN)).toEqual({
      ok: false,
      status: 404,
    });
  });

  it("concluido -> 409 motivo concluido", async () => {
    const r = await validarConvite(
      fakeAdmin({ id: "i", status: "concluido", modo: "producao", expira_em: null, primeiro_acesso_em: null, study_id: "s" }),
      TOKEN,
    );
    expect(r).toEqual({ ok: false, status: 409, motivo: "concluido" });
  });

  it("recusou -> 409 motivo recusado", async () => {
    const r = await validarConvite(
      fakeAdmin({ id: "i", status: "recusou", modo: "producao", expira_em: null, primeiro_acesso_em: null, study_id: "s" }),
      TOKEN,
    );
    expect(r).toEqual({ ok: false, status: 409, motivo: "recusado" });
  });

  it("expirado e ainda não começou -> 410", async () => {
    const r = await validarConvite(
      fakeAdmin({ id: "i", status: "enviado", modo: "producao", expira_em: "2000-01-01T00:00:00Z", primeiro_acesso_em: null, study_id: "s" }),
      TOKEN,
    );
    expect(r).toEqual({ ok: false, status: 410 });
  });

  it("válido -> ok", async () => {
    const linha = { id: "i", status: "enviado", modo: "producao", expira_em: null, primeiro_acesso_em: null, study_id: "s" };
    const r = await validarConvite(fakeAdmin(linha), TOKEN);
    expect(r).toEqual({ ok: true, convite: linha });
  });
});
