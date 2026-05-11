import { describe, expect, it } from "vitest";

import {
  MUNSELL_BY_FITZPATRICK,
  SEASONS_DATABASE,
  getValidationPhrase,
  getValidHexesForSeason,
  isHexValidForSeason,
  type SeasonId,
} from "@/lib/ai/knowledge/seasons-database";

// G.6.A — 14 estaciones canónicas (antes 11, +3 nuevas). Cada una con
// exactamente 12 hex irradian curados (antes 4-5 por estación,
// obligando a la IA a inventar para llegar a 6 en la paleta).
// Ver header de seasons-database.ts para el racional de "por qué 14".
const ALL_SEASONS: SeasonId[] = [
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

describe("SEASONS_DATABASE — integridad de las 14 estaciones", () => {
  it("contiene exactamente 14 entradas (11 V2 + 3 nuevas G.6.A)", () => {
    // El tipo SeasonId está declarado con 14 valores: las 11 V2
    // originales (con soft_winter rescatada de §3.3 + Apéndice B) +
    // las 3 nuevas G.6.A (light_summer, bright_winter, dark_spring,
    // reincorporadas desde §3.1). Ver header de seasons-database.ts
    // para el racional de "por qué 14 y no 12".
    expect(Object.keys(SEASONS_DATABASE)).toHaveLength(ALL_SEASONS.length);
  });

  it("cada season tiene id idéntico al key", () => {
    for (const seasonId of ALL_SEASONS) {
      expect(SEASONS_DATABASE[seasonId].id).toBe(seasonId);
    }
  });

  it("cada season tiene exactamente 12 hex irradian con formato #RRGGBB", () => {
    for (const seasonId of ALL_SEASONS) {
      const season = SEASONS_DATABASE[seasonId];
      expect(season.irradian).toHaveLength(12);
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

  it("incluye las 3 estaciones nuevas de G.6.A (light_summer, bright_winter, dark_spring)", () => {
    expect(SEASONS_DATABASE.light_summer).toBeDefined();
    expect(SEASONS_DATABASE.bright_winter).toBeDefined();
    expect(SEASONS_DATABASE.dark_spring).toBeDefined();
    // Cada una con sus 12 hex.
    expect(SEASONS_DATABASE.light_summer.irradian).toHaveLength(12);
    expect(SEASONS_DATABASE.bright_winter.irradian).toHaveLength(12);
    expect(SEASONS_DATABASE.dark_spring.irradian).toHaveLength(12);
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
    // True Spring tiene #FFBE8C (Melocotón luminoso) en irradian.
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
  it("retorna array de exactamente 12 hex codes por season", () => {
    for (const seasonId of ALL_SEASONS) {
      const hexes = getValidHexesForSeason(seasonId);
      expect(hexes).toHaveLength(12);
      for (const hex of hexes) {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});

describe("getValidationPhrase", () => {
  it("retorna phrase non-empty para las 14 estaciones canónicas", () => {
    for (const seasonId of ALL_SEASONS) {
      const phrase = getValidationPhrase(seasonId);
      expect(typeof phrase).toBe("string");
      expect(phrase.length).toBeGreaterThan(20);
    }
  });
});

describe("SEASONS_DATABASE — makeupPalettes (G.6.B)", () => {
  it("cada season tiene makeupPalettes con las 5 categorías presentes", () => {
    for (const seasonId of ALL_SEASONS) {
      const mp = SEASONS_DATABASE[seasonId].makeupPalettes;
      expect(mp).toBeDefined();
      expect(mp.lipstick).toBeDefined();
      expect(mp.blush).toBeDefined();
      expect(mp.eyeshadow).toBeDefined();
      expect(mp.eyeliner).toBeDefined();
      expect(mp.foundation).toBeDefined();
    }
  });

  it("cada categoría tiene el count canónico exacto (5/3/6/3/3)", () => {
    for (const seasonId of ALL_SEASONS) {
      const mp = SEASONS_DATABASE[seasonId].makeupPalettes;
      expect(mp.lipstick, `${seasonId}.lipstick`).toHaveLength(5);
      expect(mp.blush, `${seasonId}.blush`).toHaveLength(3);
      expect(mp.eyeshadow, `${seasonId}.eyeshadow`).toHaveLength(6);
      expect(mp.eyeliner, `${seasonId}.eyeliner`).toHaveLength(3);
      expect(mp.foundation, `${seasonId}.foundation`).toHaveLength(3);
    }
  });

  it("todos los hex de makeupPalettes son #RRGGBB válidos con nombre non-empty", () => {
    for (const seasonId of ALL_SEASONS) {
      const mp = SEASONS_DATABASE[seasonId].makeupPalettes;
      const allItems = [
        ...mp.lipstick,
        ...mp.blush,
        ...mp.eyeshadow,
        ...mp.eyeliner,
        ...mp.foundation,
      ];
      for (const item of allItems) {
        expect(item.hex, `${seasonId}: ${item.hex}`).toMatch(
          /^#[0-9A-Fa-f]{6}$/,
        );
        expect(item.nombre.length).toBeGreaterThan(0);
      }
    }
  });

  it("el total por estación es exactamente 20 hex de maquillaje (5+3+6+3+3)", () => {
    for (const seasonId of ALL_SEASONS) {
      const mp = SEASONS_DATABASE[seasonId].makeupPalettes;
      const total =
        mp.lipstick.length +
        mp.blush.length +
        mp.eyeshadow.length +
        mp.eyeliner.length +
        mp.foundation.length;
      expect(total, `${seasonId} makeup hex total`).toBe(20);
    }
  });
});
