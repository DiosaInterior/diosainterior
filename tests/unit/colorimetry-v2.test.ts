import { describe, expect, it } from "vitest";

import {
  PROMPT_VERSION,
  buildColorimetryPrompt,
} from "@/lib/ai/prompts/colorimetry-v2";

describe("colorimetry-v2 prompt — smoke", () => {
  it("exporta PROMPT_VERSION = '2.1.0' (bumpeado en G.6.A)", () => {
    expect(PROMPT_VERSION).toBe("2.1.0");
  });

  it("buildColorimetryPrompt es una función pura sin argumentos", () => {
    expect(typeof buildColorimetryPrompt).toBe("function");
    expect(buildColorimetryPrompt.length).toBe(0);
  });

  it("retorna un string no vacío", () => {
    const prompt = buildColorimetryPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(2000);
  });

  it("es determinístico — dos llamadas devuelven idéntico output", () => {
    expect(buildColorimetryPrompt()).toBe(buildColorimetryPrompt());
  });

  it("contiene los 10 marcadores de sección", () => {
    const prompt = buildColorimetryPrompt();
    for (let i = 1; i <= 10; i += 1) {
      expect(prompt).toContain(`## Section ${i} —`);
    }
  });

  it("usa '---' como separador entre secciones", () => {
    const prompt = buildColorimetryPrompt();
    // 10 secciones → 9 separadores.
    const matches = prompt.match(/\n\n---\n\n/g) ?? [];
    expect(matches).toHaveLength(9);
  });
});

describe("colorimetry-v2 prompt — embedded scientific data", () => {
  const prompt = buildColorimetryPrompt();

  it("incluye el hex de True Spring melocotón (#FFBE8C)", () => {
    expect(prompt).toContain("#FFBE8C");
  });

  it("incluye el hex de Soft Winter Lavanda (#A89CC8 tras G.6.A KB expansion)", () => {
    expect(prompt).toContain("#A89CC8");
  });

  it("incluye el jewelry type 'gold_antique' (Deep Autumn)", () => {
    expect(prompt).toContain("gold_antique");
  });

  it("incluye la notación Munsell '5YR 7/4' (Fitzpatrick II)", () => {
    expect(prompt).toContain("5YR 7/4");
  });

  it("incluye la validation phrase literal de Clear Winter (Apéndice B)", () => {
    expect(prompt).toContain(
      "All cool and clear — Clear Winter is high contrast always",
    );
  });

  it("incluye los 14 ids de season canónicos en snake_case (11 V2 + 3 nuevas G.6.A)", () => {
    const ids = [
      "true_spring",
      "light_spring",
      "bright_spring",
      "dark_spring",
      "true_summer",
      "soft_summer",
      "light_summer",
      "soft_winter",
      "true_winter",
      "deep_winter",
      "bright_winter",
      "true_autumn",
      "soft_autumn",
      "deep_autumn",
    ];
    for (const id of ids) {
      expect(prompt).toContain(`(${id})`);
    }
  });

  it("incluye el tool name 'submit_colorimetric_analysis'", () => {
    expect(prompt).toContain("submit_colorimetric_analysis");
  });
});

describe("colorimetry-v2 prompt — snapshot", () => {
  it("matches saved snapshot (run with -u to regenerate after intentional changes)", () => {
    expect(buildColorimetryPrompt()).toMatchSnapshot();
  });
});
