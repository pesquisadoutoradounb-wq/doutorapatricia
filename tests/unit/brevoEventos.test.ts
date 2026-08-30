import { describe, expect, it } from "vitest";
import {
  inviteIdDaTag,
  tipoEventoBrevo,
} from "../../supabase/functions/_shared/brevoEventos";

describe("tipoEventoBrevo", () => {
  it("mapeia os eventos conhecidos do Brevo", () => {
    expect(tipoEventoBrevo("request")).toBe("enviado");
    expect(tipoEventoBrevo("delivered")).toBe("entregue");
    expect(tipoEventoBrevo("opened")).toBe("aberto");
    expect(tipoEventoBrevo("unique_opened")).toBe("aberto");
    expect(tipoEventoBrevo("click")).toBe("clicado");
    expect(tipoEventoBrevo("hard_bounce")).toBe("bounce");
    expect(tipoEventoBrevo("soft_bounce")).toBe("bounce");
    expect(tipoEventoBrevo("blocked")).toBe("bounce");
    expect(tipoEventoBrevo("spam")).toBe("spam");
  });

  it("é tolerante a caixa e espaços", () => {
    expect(tipoEventoBrevo(" Delivered ")).toBe("entregue");
  });

  it("evento desconhecido ou não-string → 'outro'", () => {
    expect(tipoEventoBrevo("foo")).toBe("outro");
    expect(tipoEventoBrevo(null)).toBe("outro");
    expect(tipoEventoBrevo(42)).toBe("outro");
  });
});

describe("inviteIdDaTag", () => {
  const uuid = "11111111-2222-4333-8444-555555555555";

  it("lê o UUID de payload.tags[0]", () => {
    expect(inviteIdDaTag({ tags: [uuid] })).toBe(uuid);
    expect(inviteIdDaTag({ tags: uuid })).toBe(uuid);
  });

  it("retorna null sem tag ou com tag não-UUID", () => {
    expect(inviteIdDaTag({})).toBeNull();
    expect(inviteIdDaTag({ tags: ["nao-uuid"] })).toBeNull();
    expect(inviteIdDaTag({ tags: [] })).toBeNull();
  });
});
