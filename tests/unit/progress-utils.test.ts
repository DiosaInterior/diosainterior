import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  calcProgressPercent,
  copyForSubstage,
  type Substage,
} from "@/components/analizando/_progress";

describe("calcProgressPercent — base substages", () => {
  it("retorna 0 para 'pending'", () => {
    expect(calcProgressPercent("pending", null)).toBe(0);
  });

  it("retorna 15 para 'loading_photos'", () => {
    expect(calcProgressPercent("loading_photos", null)).toBe(15);
  });

  it("retorna 92 para 'persisting'", () => {
    expect(calcProgressPercent("persisting", null)).toBe(92);
  });

  it("retorna 100 para 'done'", () => {
    expect(calcProgressPercent("done", null)).toBe(100);
  });

  it("retorna 0 para 'failed'", () => {
    expect(calcProgressPercent("failed", null)).toBe(0);
  });
});

describe("calcProgressPercent — calling_ai (interpolación)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 30 (base) cuando no hay substageStartedAt", () => {
    expect(calcProgressPercent("calling_ai", null)).toBe(30);
  });

  it("retorna 30 cuando elapsed = 0", () => {
    const now = new Date("2026-05-08T00:00:00.000Z");
    vi.setSystemTime(now);
    expect(calcProgressPercent("calling_ai", now.toISOString())).toBe(30);
  });

  it("interpola hacia 85 cuando elapsed = 22000ms", () => {
    const start = new Date("2026-05-08T00:00:00.000Z");
    vi.setSystemTime(new Date(start.getTime() + 22_000));
    expect(calcProgressPercent("calling_ai", start.toISOString())).toBe(85);
  });

  it("clampea a 85 cuando elapsed > 22000ms (overshoot)", () => {
    const start = new Date("2026-05-08T00:00:00.000Z");
    vi.setSystemTime(new Date(start.getTime() + 60_000));
    expect(calcProgressPercent("calling_ai", start.toISOString())).toBe(85);
  });

  it("interpola en el medio (~57) a los 11000ms (50% del rango)", () => {
    const start = new Date("2026-05-08T00:00:00.000Z");
    vi.setSystemTime(new Date(start.getTime() + 11_000));
    // 30 + 0.5 * (85 - 30) = 30 + 27.5 = 57.5 → round = 58
    expect(calcProgressPercent("calling_ai", start.toISOString())).toBe(58);
  });

  it("nunca baja de 30 si nowMs < startedAtMs (clock skew defensivo)", () => {
    const start = new Date("2026-05-08T00:00:00.000Z");
    vi.setSystemTime(new Date(start.getTime() - 5_000));
    expect(calcProgressPercent("calling_ai", start.toISOString())).toBe(30);
  });
});

describe("copyForSubstage", () => {
  it("retorna copy específica para cada substage", () => {
    const allSubstages: Substage[] = [
      "pending",
      "loading_photos",
      "calling_ai",
      "persisting",
      "done",
      "failed",
    ];
    for (const s of allSubstages) {
      const copy = copyForSubstage(s);
      expect(typeof copy).toBe("string");
      expect(copy.length).toBeGreaterThan(0);
    }
  });

  it("'pending' y 'loading_photos' comparten copy (transición invisible)", () => {
    expect(copyForSubstage("pending")).toBe(copyForSubstage("loading_photos"));
  });

  it("'done' tiene la frase final 'Tu guía está lista.'", () => {
    expect(copyForSubstage("done")).toBe("Tu guía está lista.");
  });
});
