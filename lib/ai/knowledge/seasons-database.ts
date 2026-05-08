// =====================================================================
// Diosa Interior — Knowledge base de las 11 estaciones canónicas V2
// =====================================================================
// Single source of truth. Toda otra capa (Zod schemas, tool definitions,
// prompts, analysis service) importa de aquí. No duplicar season ids
// ni hex codes en otros archivos — siempre re-exportar o leer.
//
// Fuente: BIBLIA_IMAGEN_DIOSA_INTERIOR.md (en /docs/) §3.1 (12 estaciones
// canónicas), §3.2 (Munsell por Fitzpatrick), §3.3 (irradian/apagan
// detallado por estación), Apéndice B (validation phrases).
//
// La lista canónica V2 son 11 estaciones (no 12). Decisiones tomadas
// en F.1 plan:
//   - light_summer EXCLUIDA: §3.1 la lista pero §3.3 no la detalla,
//     no hay irradian/apagan para validación cruzada en F.3.
//   - bright_winter EXCLUIDA: en §3.1 pero sin data en §3.3.
//   - dark_spring EXCLUIDA: en §3.3 + Apéndice B pero fuera del scope V2.
//   - soft_winter INCLUIDA: ausente en §3.1 (omisión editorial), pero
//     §3.3 + Apéndice B la respaldan.
//
// Aliases canónicos (Q5 del plan):
//   - true_autumn ←→ warm_autumn (Apéndice B usa "Warm Autumn").
//   - true_winter ←→ clear_winter (Apéndice B usa "Clear Winter").
//
// TODO(post-F.1): actualizar comment del schema BD en migration 000X
// para reflejar la lista canónica de 11 ids (true_autumn no warm_autumn).
//
// Hex inference: cuando §3.3 menciona un color por nombre sin código
// hex (ej. "lavanda suave"), se asignó un hex canónico estándar y se
// marca con comentario `// hex inferido por nombre`. Las entradas con
// hex literal de §3.3 NO llevan ese comentario.
// =====================================================================

// ---------------------------------------------------------------------
// TIPOS BASE
// ---------------------------------------------------------------------

export type SeasonId =
  | "true_spring"
  | "light_spring"
  | "bright_spring"
  | "true_summer"
  | "soft_summer"
  | "soft_winter"
  | "true_winter"
  | "deep_winter"
  | "true_autumn"
  | "soft_autumn"
  | "deep_autumn";

export type Hue = "warm" | "cool" | "neutral_warm" | "neutral_cool";
export type Value = "light" | "medium" | "dark";
export type Chroma = "clear" | "bright" | "muted";
export type Fitzpatrick = 1 | 2 | 3 | 4 | 5 | 6;

// Enum cerrado de metales — si una season usa uno nuevo, expandir
// conscientemente (no admitir string libre).
export type JewelryType =
  | "gold_yellow"
  | "gold_warm"
  | "silver"
  | "platinum"
  | "bronze"
  | "copper"
  | "rose_gold"
  | "gold_antique"
  | "silver_oxidized";

export type IrradianColor = {
  hex: string;
  nombre: string;
};

export type Season = {
  id: SeasonId;
  displayName: string;
  hue: Hue;
  value: Value;
  chroma: Chroma;
  typicalFitzpatrick: ReadonlyArray<Fitzpatrick>;
  irradian: ReadonlyArray<IrradianColor>;
  apagan: ReadonlyArray<string>;
  jewelry: JewelryType;
  validationPhrase: string;

  // Optional
  aliases?: ReadonlyArray<string>;
  lipstick?: { name: string; hex: string };
  blush?: { name: string; hex: string };
  metal?: string;
};

// ---------------------------------------------------------------------
// MUNSELL POR FITZPATRICK
// ---------------------------------------------------------------------
// Fuente: BIBLIA_IMAGEN §3.2. lAvg es el valor promedio de L* en CIE Lab
// para la piel típica de ese Fitzpatrick.

export const MUNSELL_BY_FITZPATRICK: Readonly<
  Record<Fitzpatrick, { munsell: string; lAvg: number; description: string }>
> = {
  1: { munsell: "2.5YR 8/2", lAvg: 82, description: "Porcelana muy clara" },
  2: { munsell: "5YR 7/4", lAvg: 72, description: "Clara cálida con pecas posibles" },
  3: { munsell: "7.5YR 6/4", lAvg: 62, description: "Media dorada" },
  4: { munsell: "5YR 5/6", lAvg: 55, description: "Morena cálida media" },
  5: { munsell: "5YR 3/4", lAvg: 38, description: "Morena oscura cálida" },
  6: { munsell: "5YR 2/2", lAvg: 25, description: "Muy oscura profunda" },
};

// ---------------------------------------------------------------------
// SEASONS DATABASE
// ---------------------------------------------------------------------

export const SEASONS_DATABASE: Readonly<Record<SeasonId, Season>> = {
  true_spring: {
    id: "true_spring",
    displayName: "True Spring",
    hue: "warm",
    value: "light",
    chroma: "clear",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#FFBE8C", nombre: "melocotón luminoso" }, // §11 BIBLIA, paleta validada en producción (Repostera)
      { hex: "#FF7F5C", nombre: "coral cálido" }, // §11 BIBLIA + §14.2
      { hex: "#C8E08C", nombre: "verde manzana" }, // §11 BIBLIA, paleta validada
      { hex: "#F4DEB3", nombre: "crema dorada" }, // hex inferido por nombre
      { hex: "#F8E59B", nombre: "amarillo claro" }, // hex inferido por nombre
    ],
    apagan: ["negro puro", "gris frío", "azul marino", "burdeos oscuro", "blanco frío"],
    jewelry: "gold_yellow",
    lipstick: { name: "melocotón", hex: "#E8785A" },
    blush: { name: "coral suave", hex: "#FFB49A" },
    metal: "oro cálido siempre",
    validationPhrase:
      "All warm, bright, luminous — True Spring is never muted or cool.",
  },

  light_spring: {
    id: "light_spring",
    displayName: "Light Spring",
    hue: "warm",
    value: "light",
    chroma: "muted",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#FFD1B5", nombre: "melocotón pálido" }, // hex inferido por nombre
      { hex: "#FFB7A0", nombre: "coral luminoso suave" }, // hex inferido por nombre
      { hex: "#B8E0C8", nombre: "verde menta" }, // hex inferido por nombre
      { hex: "#FAEFD8", nombre: "crema" }, // hex inferido por nombre
    ],
    apagan: ["colores oscuros o muy saturados", "negro"],
    jewelry: "gold_yellow",
    lipstick: { name: "coral pálido", hex: "#FFB7A0" }, // hex inferido por nombre
    // validationPhrase generada en F.1 (no aparece en Apéndice B):
    // patrón derivado de las phrases existentes + características §3.1.
    validationPhrase:
      "All warm, light, soft — Light Spring is never deep or saturated.",
  },

  bright_spring: {
    id: "bright_spring",
    displayName: "Bright Spring",
    hue: "warm",
    value: "light",
    chroma: "bright",
    typicalFitzpatrick: [2],
    irradian: [
      { hex: "#FF6040", nombre: "coral vivo" },
      { hex: "#4DBFB8", nombre: "turquesa cálido" }, // hex inferido por nombre
      { hex: "#F4E04A", nombre: "amarillo limón" }, // hex inferido por nombre
      { hex: "#5BC862", nombre: "verde brillante" }, // hex inferido por nombre
    ],
    apagan: ["tonos apagados o muted", "negro"],
    jewelry: "gold_yellow",
    lipstick: { name: "coral vivo", hex: "#FF6040" },
    // validationPhrase generada en F.1.
    validationPhrase:
      "All warm, light, bright — Bright Spring is never muted or earthy.",
  },

  true_summer: {
    id: "true_summer",
    displayName: "True Summer",
    hue: "cool",
    value: "light",
    chroma: "muted",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#D8A6B5", nombre: "rosa polvoso" }, // hex inferido por nombre
      { hex: "#C9B8D9", nombre: "lavanda suave" }, // hex inferido por nombre
      { hex: "#6F8AA8", nombre: "azul pizarra" }, // hex inferido por nombre
      { hex: "#BFA9A9", nombre: "gris rosado" }, // hex inferido por nombre
    ],
    apagan: ["colores cálidos intensos", "naranja", "mostaza"],
    jewelry: "silver",
    lipstick: { name: "rosa polvoso", hex: "#C87890" },
    validationPhrase:
      "All cool and soft — True Summer is never warm or vivid.",
  },

  soft_summer: {
    id: "soft_summer",
    displayName: "Soft Summer",
    hue: "cool",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [2, 3],
    irradian: [
      { hex: "#B69BA8", nombre: "malva apagado" }, // hex inferido por nombre
      { hex: "#8FA0AB", nombre: "azul grisáceo" }, // hex inferido por nombre
      { hex: "#C49A99", nombre: "rosa antiguo" }, // hex inferido por nombre
      { hex: "#A6938B", nombre: "gris cálido" }, // hex inferido por nombre
    ],
    apagan: ["colores vivos", "negro puro", "naranja"],
    jewelry: "silver_oxidized",
    lipstick: { name: "malva suave", hex: "#C090A0" },
    // validationPhrase generada en F.1.
    validationPhrase:
      "All cool, muted, balanced — Soft Summer is never bright or warm.",
  },

  soft_winter: {
    id: "soft_winter",
    // Ausente en §3.1 (canon list) pero presente en §3.3 + Apéndice B.
    // Decisión Q2: incluir como canónica V2.
    displayName: "Soft Winter",
    hue: "cool",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#9090C8", nombre: "lavanda" }, // §11 BIBLIA, paleta validada en producción (Adolescente fresa)
      { hex: "#C5C0BD", nombre: "gris perla" }, // hex inferido por nombre
      { hex: "#6F8AA8", nombre: "azul pizarra" }, // hex inferido por nombre
      { hex: "#BC8C9F", nombre: "rosa malva fría" }, // hex inferido por nombre
    ],
    apagan: ["naranja", "mostaza", "colores cálidos intensos"],
    jewelry: "silver",
    lipstick: { name: "rosa malva frío", hex: "#C87890" },
    validationPhrase:
      "All cool and muted — Soft Winter is never warm or saturated.",
  },

  true_winter: {
    id: "true_winter",
    displayName: "True Winter",
    hue: "cool",
    value: "dark",
    chroma: "clear",
    typicalFitzpatrick: [3, 4, 5],
    aliases: ["clear_winter"],
    irradian: [
      { hex: "#000000", nombre: "negro" },
      { hex: "#FFFFFF", nombre: "blanco puro" },
      { hex: "#0F52BA", nombre: "azul zafiro" }, // hex inferido por nombre
      { hex: "#DC1A2D", nombre: "rojo puro" }, // hex inferido por nombre
      { hex: "#D02380", nombre: "fucsia" }, // hex inferido por nombre
    ],
    apagan: ["tonos tierra", "colores cálidos", "muted"],
    jewelry: "silver",
    lipstick: { name: "rojo cereza", hex: "#CC2244" },
    // validationPhrase literal del Apéndice B (bajo alias "Clear Winter").
    // El alias warm_autumn no aplica aquí; éste es clear_winter ←→ true_winter.
    validationPhrase:
      "All cool and clear — Clear Winter is high contrast always. Never warm, never muted.",
  },

  deep_winter: {
    id: "deep_winter",
    displayName: "Deep Winter",
    hue: "cool",
    value: "dark",
    chroma: "muted",
    typicalFitzpatrick: [5, 6],
    irradian: [
      { hex: "#5C0F18", nombre: "borgoña frío" }, // hex inferido por nombre
      { hex: "#14243B", nombre: "azul marino" }, // hex inferido por nombre
      { hex: "#000000", nombre: "negro" },
      { hex: "#14704A", nombre: "esmeralda frío" }, // hex inferido por nombre
      { hex: "#4D1A35", nombre: "ciruela" }, // hex inferido por nombre
    ],
    apagan: ["colores cálidos", "pasteles", "tonos tierra"],
    jewelry: "silver",
    lipstick: { name: "ciruela oscura", hex: "#4D1A35" }, // hex inferido por nombre
    validationPhrase:
      "All cool and deep — Deep Winter is never warm or light.",
  },

  true_autumn: {
    id: "true_autumn",
    displayName: "True Autumn",
    hue: "warm",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [3, 4],
    aliases: ["warm_autumn"],
    irradian: [
      { hex: "#8B3A2A", nombre: "teja" },
      { hex: "#B8860B", nombre: "mostaza" },
      { hex: "#6B7C45", nombre: "verde oliva" },
      { hex: "#C4622A", nombre: "siena" },
    ],
    apagan: ["negro puro", "blanco brillante", "colores fríos"],
    jewelry: "bronze",
    lipstick: { name: "terracota", hex: "#C4622A" },
    // Apéndice B usa "Warm Autumn" — phrase canónica para true_autumn.
    validationPhrase:
      "All warm, rich, earthy — Warm Autumn is never cool or pastel.",
  },

  soft_autumn: {
    id: "soft_autumn",
    displayName: "Soft Autumn",
    hue: "neutral_warm",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [3, 4],
    irradian: [
      { hex: "#C4724A", nombre: "terracota apagada" },
      { hex: "#C4A060", nombre: "ocre suave" },
      { hex: "#8C9E6A", nombre: "salvia" },
      { hex: "#C4B49A", nombre: "arena" },
    ],
    apagan: ["colores brillantes o fríos"],
    jewelry: "bronze",
    lipstick: { name: "rosa antiguo apagado", hex: "#C4785A" },
    validationPhrase:
      "All muted and warm — Soft Autumn has low chroma always. Never bright, never cool.",
  },

  deep_autumn: {
    id: "deep_autumn",
    displayName: "Deep Autumn",
    hue: "warm",
    value: "dark",
    chroma: "muted",
    typicalFitzpatrick: [4, 5],
    irradian: [
      { hex: "#6B1B2A", nombre: "borgoña" },
      { hex: "#B8860B", nombre: "ámbar" },
      { hex: "#355E3B", nombre: "verde cazador" },
      { hex: "#8B3A2A", nombre: "teja oscura" },
    ],
    apagan: ["pasteles", "colores fríos", "negro puro"],
    jewelry: "gold_antique",
    lipstick: { name: "rojo ladrillo", hex: "#8B2A1A" },
    validationPhrase:
      "All deep, warm, rich — Deep Autumn never cool or light.",
  },
};

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------

/**
 * True si el hex corresponde a uno de los colores irradian de la season.
 * Comparación case-insensitive del string hex (ej. "#FF6040" === "#ff6040").
 */
export function isHexValidForSeason(
  hex: string,
  seasonId: SeasonId,
): boolean {
  const normalized = hex.toLowerCase();
  const season = SEASONS_DATABASE[seasonId];
  return season.irradian.some((c) => c.hex.toLowerCase() === normalized);
}

/**
 * Lista de hex codes irradian de una season — útil para construir paletas
 * candidatas o validar batches en F.3.
 */
export function getValidHexesForSeason(
  seasonId: SeasonId,
): ReadonlyArray<string> {
  return SEASONS_DATABASE[seasonId].irradian.map((c) => c.hex);
}

/**
 * Validation phrase de una season. Las 11 estaciones canónicas tienen
 * phrase obligatoria — nunca retorna null. La diseñamos así para que
 * el prompt en F.2 pueda incluirla siempre sin checks defensivos.
 */
export function getValidationPhrase(seasonId: SeasonId): string {
  return SEASONS_DATABASE[seasonId].validationPhrase;
}
