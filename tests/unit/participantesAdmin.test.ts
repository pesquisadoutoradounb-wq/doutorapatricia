import { describe, expect, it } from "vitest";
import {
  pseudonimoCurto,
  tempoTotal,
} from "../../src/lib/participantesAdmin";

describe("pseudonimoCurto", () => {
  it("usa os 8 primeiros caracteres do uuid", () => {
    expect(pseudonimoCurto("11111111-2222-4333-8444-555555555555")).toBe("11111111");
  });
});

describe("tempoTotal", () => {
  it("null quando não concluído", () => {
    expect(tempoTotal("2026-08-01T10:00:00Z", null)).toBeNull();
  });

  it("minutos abaixo de 1 h", () => {
    expect(
      tempoTotal("2026-08-01T10:00:00Z", "2026-08-01T10:42:00Z"),
    ).toBe("42 min");
  });

  it("horas e minutos acima de 1 h", () => {
    expect(
      tempoTotal("2026-08-01T10:00:00Z", "2026-08-01T11:30:00Z"),
    ).toBe("1 h 30 min");
  });

  it("null quando a conclusão é anterior ao início", () => {
    expect(
      tempoTotal("2026-08-01T12:00:00Z", "2026-08-01T10:00:00Z"),
    ).toBeNull();
  });
});
