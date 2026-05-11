import { describe, expect, it } from "vitest";

import { GuideSchema, SeasonEnum } from "@/lib/validation/guide-schema";
import type { SeasonId } from "@/lib/ai/knowledge/seasons-database";

import { validGuide } from "./fixtures/valid-guide";

describe("GuideSchema — happy path", () => {
  it("parsea el fixture canónico de True Spring sin lanzar", () => {
    expect(() => GuideSchema.parse(validGuide)).not.toThrow();
  });

  it("retorna el mismo shape via .parse() (sin transformaciones)", () => {
    const parsed = GuideSchema.parse(validGuide);
    expect(parsed).toEqual(validGuide);
  });
});

describe("GuideSchema — rechazos", () => {
  it("rechaza season unknown (no en SeasonEnum)", () => {
    const bad = { ...validGuide, scientific: { ...validGuide.scientific, season: "fake_season" as SeasonId } };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza fitzpatrick fuera de 1-6", () => {
    const bad0 = { ...validGuide, scientific: { ...validGuide.scientific, fitzpatrick: 0 as 1 } };
    const bad7 = { ...validGuide, scientific: { ...validGuide.scientific, fitzpatrick: 7 as 1 } };
    expect(() => GuideSchema.parse(bad0)).toThrow();
    expect(() => GuideSchema.parse(bad7)).toThrow();
  });

  it("rechaza cie_lab.L fuera de [0, 100]", () => {
    const bad = {
      ...validGuide,
      scientific: { ...validGuide.scientific, cie_lab: { L: 101, a: 12, b: 20 } },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza notación Munsell mal formada", () => {
    const bad = {
      ...validGuide,
      scientific: { ...validGuide.scientific, munsell_notation: "not-a-munsell" },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza hex inválido en palette.colors", () => {
    const bad = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        colors: validGuide.palette.colors.map((c, i) =>
          i === 0 ? { ...c, hex: "not-a-hex" } : c,
        ),
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza palette.colors con length distinto a 6", () => {
    const bad = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        colors: validGuide.palette.colors.slice(0, 5),
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });
});

describe("GuideSchema — G.6.A endurecimiento", () => {
  // Cross-field: la categorización (hue/value/chroma) reportada en
  // 'scientific' DEBE matchear la del KB canónico para esa season.
  // Antes de G.6.A esto no se validaba — la IA en producción reportó
  // value=medium para true_winter (canónico=dark) y pasó.
  it("rechaza guide con season=true_winter pero value=light (mismatch canon)", () => {
    const bad = {
      ...validGuide,
      scientific: {
        ...validGuide.scientific,
        season: "true_winter" as const,
        hue: "cool" as const,
        value: "light" as const, // canónico es "dark"
        chroma: "clear" as const,
        munsell_notation: "7.5YR 6/4",
        fitzpatrick: 4 as const,
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza guide con season=true_winter pero hue=warm (mismatch canon)", () => {
    const bad = {
      ...validGuide,
      scientific: {
        ...validGuide.scientific,
        season: "true_winter" as const,
        hue: "warm" as const, // canónico es "cool"
        value: "dark" as const,
        chroma: "clear" as const,
        munsell_notation: "7.5YR 6/4",
        fitzpatrick: 4 as const,
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza guide con season=true_spring pero chroma=muted (mismatch canon)", () => {
    const bad = {
      ...validGuide,
      scientific: {
        ...validGuide.scientific,
        chroma: "muted" as const, // canónico para true_spring es "clear"
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("acepta guide con la categorización canónica completa de la season", () => {
    // El fixture válido ya cumple — re-verifica explícito.
    const good = {
      ...validGuide,
      scientific: {
        ...validGuide.scientific,
        season: "true_spring" as const,
        hue: "warm" as const,
        value: "light" as const,
        chroma: "clear" as const,
      },
    };
    expect(() => GuideSchema.parse(good)).not.toThrow();
  });

  // Undertone cerrado: antes era z.string().min(1).max(64) y la IA
  // inventó "cool_neutral_olive" en producción. Ahora enum estricto.
  it("rechaza undertone inválido como 'cool_neutral_olive'", () => {
    const bad = {
      ...validGuide,
      scientific: { ...validGuide.scientific, undertone: "cool_neutral_olive" },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("acepta los 6 undertones canónicos", () => {
    const validUndertones = [
      "warm_golden",
      "warm_peach",
      "neutral_olive",
      "neutral_balanced",
      "cool_pink",
      "cool_blue",
    ] as const;
    // Solo testeamos warm_golden y warm_peach con true_spring (canónico
    // warm) — los cool no son válidos cross-field con true_spring.
    // El test confirma que el enum acepta cada valor; el cross-field
    // hue check lo verifica otro test.
    for (const undertone of validUndertones) {
      // Necesitamos season + hue/value/chroma consistente. El schema no
      // expone UndertoneEnum directo, así que armamos un guide variando
      // el undertone y manteniendo true_spring para warm/neutral_balanced
      // o switcheando a true_summer para neutral_olive/cool_*.
      const guide = {
        ...validGuide,
        scientific: {
          ...validGuide.scientific,
          undertone,
          // Mantener consistencia con true_spring para warm/neutral_balanced.
          // neutral_olive y cool_* harían fallar el cross-field en true_spring.
          // Por eso ajustamos season para cool.
          ...(undertone === "neutral_olive" || undertone === "cool_pink" || undertone === "cool_blue"
            ? {
                season: "true_summer" as const,
                hue: "cool" as const,
                value: "light" as const,
                chroma: "muted" as const,
              }
            : { season: "true_spring" as const, hue: "warm" as const, value: "light" as const, chroma: "clear" as const }),
        },
      };
      expect(() => GuideSchema.parse(guide), `undertone ${undertone}`).not.toThrow();
    }
  });

  // palette.avoid: ahora AvoidColor[] (hex + nombre), no string[].
  it("rechaza palette.avoid como string[] (formato legacy)", () => {
    const bad = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        avoid: ["negro puro", "gris frío"] as unknown as typeof validGuide.palette.avoid,
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza palette.avoid con menos de 5 entries", () => {
    const bad = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        avoid: validGuide.palette.avoid.slice(0, 4),
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza palette.avoid con más de 10 entries", () => {
    const bad = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        avoid: Array.from({ length: 11 }, (_, i) => ({
          hex: "#000000",
          nombre: `color ${i}`,
        })),
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });

  it("rechaza AvoidColor con hex mal formado", () => {
    const bad = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        avoid: validGuide.palette.avoid.map((a, i) =>
          i === 0 ? { ...a, hex: "not-hex" } : a,
        ),
      },
    };
    expect(() => GuideSchema.parse(bad)).toThrow();
  });
});

describe("SeasonEnum — sincronía con SeasonId", () => {
  it("compile-time: SeasonEnum.options son asignables a SeasonId[]", () => {
    // El `satisfies z.ZodType<SeasonId>` en SeasonEnum garantiza esta
    // sincronía a nivel TS. Este test es runtime sanity: cada valor del
    // enum debe ser asignable a SeasonId (string literal). Si alguien
    // edita el enum sin actualizar SeasonId, TS falla antes que vitest.
    const seasons: SeasonId[] = SeasonEnum.options;
    expect(seasons).toHaveLength(14);
  });

  it("incluye las 3 estaciones nuevas de G.6.A", () => {
    expect(SeasonEnum.options).toContain("light_summer");
    expect(SeasonEnum.options).toContain("bright_winter");
    expect(SeasonEnum.options).toContain("dark_spring");
  });
});
