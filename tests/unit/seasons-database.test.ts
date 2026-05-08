import { describe, expect, it } from "vitest";

import {
  MUNSELL_BY_FITZPATRICK,
  SEASONS_DATABASE,
  getValidationPhrase,
  getValidHexesForSeason,
  isHexValidForSeason,
  type SeasonId,
} from "@/lib/ai/knowledge/seasons-database";

const ALL_SEASONS: SeasonId[] = [
  "true_spring",
  "light_spring",
  "bright_spring",
  "true_summer",
  "soft_summer",
  "soft_winter",
  "true_winter",
  "deep_winter",
  "true_autumn",
  "soft_autumn",
  "deep_autumn",
];

describe("SEASONS_DATABASE — integridad de las 11 estaciones", () => {
  it("contiene exactamente 11 entradas", () => {
    expect(Object.keys(SEASONS_DATABASE)).toHaveLength(11);
  });

  it("cada season tiene id idéntico al key", () => {
    for (const seasonId of ALL_SEASONS) {
      expect(SEASONS_DATABASE[seasonId].id).toBe(seasonId);
    }
  });

  it("cada season tiene irradian con 4+ colores y todos los hex válidos #RRGGBB", () => {
    for (const seasonId of ALL_SEASONS) {
      const season = SEASONS_DATABASE[seasonId];
      expect(season.irradian.length).toBeGreaterThanOrEqual(4);
      for (const c of season.irradian) {
        expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(c.nombre.length).toBeGreaterThan(0);
      }
    }
  });

  it("aliases solo aparecen en true_autumn (warm_autumn) y true_winter (clear_winter)", () => {
    expect(SEASONS_DATABASE.true_autumn.aliases).toEqual(["warm_autumn"]);
    expect(SEASONS_DATABASE.true_winter.aliases).toEqual(["clear_winter"]);
    // El resto no tiene aliases.
    const others: SeasonId[] = ALL_SEASONS.filter(
      (id) => id !== "true_autumn" && id !== "true_winter",
    );
    for (const seasonId of others) {
      expect(SEASONS_DATABASE[seasonId].aliases).toBeUndefined();
    }
  });
});

describe("MUNSELL_BY_FITZPATRICK", () => {
  it("contiene los 6 niveles Fitzpatrick (1-6)", () => {
    const keys = Object.keys(MUNSELL_BY_FITZPATRICK).map(Number).sort();
    expect(keys).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("cada entrada tiene formato Munsell válido y lAvg en [0,100]", () => {
    for (const key of [1, 2, 3, 4, 5, 6] as const) {
      const entry = MUNSELL_BY_FITZPATRICK[key];
      expect(entry.munsell).toMatch(/^\d+(\.\d+)?[A-Z]+ \d+(\.\d+)?\/\d+(\.\d+)?$/);
      expect(entry.lAvg).toBeGreaterThanOrEqual(0);
      expect(entry.lAvg).toBeLessThanOrEqual(100);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});

describe("isHexValidForSeason", () => {
  it("true cuando el hex está en irradian (case-insensitive)", () => {
    // True Spring tiene #FFBE8C (melocotón luminoso, §11 BIBLIA) en irradian.
    expect(isHexValidForSeason("#FFBE8C", "true_spring")).toBe(true);
    expect(isHexValidForSeason("#ffbe8c", "true_spring")).toBe(true);
  });

  it("false cuando el hex NO está en irradian de la season", () => {
    // #000000 (negro) NO está en true_spring irradian (sí en true_winter).
    expect(isHexValidForSeason("#000000", "true_spring")).toBe(false);
    // #FFBE8C (melocotón) NO está en deep_winter.
    expect(isHexValidForSeason("#FFBE8C", "deep_winter")).toBe(false);
  });
});

describe("getValidHexesForSeason", () => {
  it("retorna array de strings con al menos 4 hex codes por season", () => {
    for (const seasonId of ALL_SEASONS) {
      const hexes = getValidHexesForSeason(seasonId);
      expect(hexes.length).toBeGreaterThanOrEqual(4);
      for (const hex of hexes) {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});

describe("getValidationPhrase", () => {
  it("retorna phrase non-empty para las 11 estaciones", () => {
    for (const seasonId of ALL_SEASONS) {
      const phrase = getValidationPhrase(seasonId);
      expect(typeof phrase).toBe("string");
      expect(phrase.length).toBeGreaterThan(20);
    }
  });
});
