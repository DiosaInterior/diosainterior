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

describe("SeasonEnum — sincronía con SeasonId", () => {
  it("compile-time: SeasonEnum.options son asignables a SeasonId[]", () => {
    // El `satisfies z.ZodType<SeasonId>` en SeasonEnum garantiza esta
    // sincronía a nivel TS. Este test es runtime sanity: cada valor del
    // enum debe ser asignable a SeasonId (string literal). Si alguien
    // edita el enum sin actualizar SeasonId, TS falla antes que vitest.
    const seasons: SeasonId[] = SeasonEnum.options;
    expect(seasons).toHaveLength(11);
  });
});
