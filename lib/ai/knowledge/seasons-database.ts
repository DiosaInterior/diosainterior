// =====================================================================
// Diosa Interior — Knowledge base de las 14 estaciones canónicas V2.1
// =====================================================================
// Single source of truth. Toda otra capa (Zod schemas, tool definitions,
// prompts, analysis service) importa de aquí. No duplicar season ids
// ni hex codes en otros archivos — siempre re-exportar o leer.
//
// Por qué 14 y no 12 de la biblia §3.1:
// - §3.1 lista 12 estaciones pero omite soft_winter (omisión editorial;
//   §3.3 + Apéndice B la respaldan con data válida).
// - V2 original incluyó las 11 con respaldo §3.3 (las 12 de §3.1 menos
//   light_summer/bright_winter/dark_spring que faltaban en §3.3, más
//   soft_winter rescatada de §3.3+Apéndice B).
// - G.6.A reincorpora light_summer, bright_winter y dark_spring con
//   hex propios — quedan 11 V2 + 3 nuevas = 14 totales.
// - La biblia se actualiza a V1.1 post-G.6 para reflejar las 14.
//
// Si en uso real una estación se demuestra redundante o falta otra,
// ajustar via PR explícito documentando la razón editorial.
//
// Fuente original: BIBLIA_IMAGEN_DIOSA_INTERIOR.md (en /docs/) §3.1
// (12 estaciones canónicas según biblia, sin soft_winter), §3.2 (Munsell
// por Fitzpatrick), §3.3 (irradian/apagan detallado por estación,
// incluye soft_winter), Apéndice B (validation phrases).
//
// G.6.A — expansión:
//   - SeasonId pasa de 11 a 14 (se incorporan light_summer, bright_winter,
//     dark_spring que estaban listadas en §3.1 pero quedaron fuera de V2).
//   - Cada irradian ahora tiene exactamente 12 hex curados — antes había
//     4-5 por estación, obligando a la IA a inventar para llegar a 6 en
//     la paleta. Hex curados por César a partir de biblia §3.3 + análisis
//     de coherencia hue/value/chroma + Munsell típico. NO son hex
//     inventados en sesión — son la versión canónica V1 de Diosa Interior.
//
// Aliases canónicos:
//   - true_autumn ←→ warm_autumn (Apéndice B usa "Warm Autumn").
//   - true_winter ←→ clear_winter (Apéndice B usa "Clear Winter").
// =====================================================================

// ---------------------------------------------------------------------
// TIPOS BASE
// ---------------------------------------------------------------------

export type SeasonId =
  | "true_spring"
  | "light_spring"
  | "bright_spring"
  | "dark_spring"
  | "true_summer"
  | "soft_summer"
  | "light_summer"
  | "soft_winter"
  | "true_winter"
  | "deep_winter"
  | "bright_winter"
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

// G.6.B — paletas de maquillaje canónicas por estación.
// 5 lipstick + 3 blush + 6 eyeshadow + 3 eyeliner + 3 foundation = 20 hex
// por estación. Curados por César (HEX_MAKEUP_G6B.md): coherencia con
// hue/value/chroma canónico, BIBLIA §3.3, cross-reference con paletas
// profesionales del mercado (Sephora Pro, MAC seasonal, NARS). Foundation
// son 3 niveles de luminosidad dentro del rango Fitzpatrick típico con
// el undertone canónico de la estación.
export type MakeupPaletteItem = {
  hex: string;
  nombre: string;
};

export type MakeupPalettes = {
  lipstick: ReadonlyArray<MakeupPaletteItem>; // length 5
  blush: ReadonlyArray<MakeupPaletteItem>; // length 3
  eyeshadow: ReadonlyArray<MakeupPaletteItem>; // length 6
  eyeliner: ReadonlyArray<MakeupPaletteItem>; // length 3
  foundation: ReadonlyArray<MakeupPaletteItem>; // length 3 (claro/medio/oscuro)
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
  makeupPalettes: MakeupPalettes;

  // Optional (legacy fields kept for compat — pueden cohabitar con
  // makeupPalettes; el primer elemento de makeupPalettes.lipstick es el
  // mismo hex que `lipstick.hex`. Limpieza en G.6.C cuando ningún
  // consumer dependa de los top-level).
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
// SEASONS DATABASE — 14 estaciones × 12 hex irradian
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
      { hex: "#FFBE8C", nombre: "Melocotón luminoso" },
      { hex: "#FF7F5C", nombre: "Coral cálido" },
      { hex: "#C8E08C", nombre: "Verde manzana" },
      { hex: "#F5E6C8", nombre: "Crema dorada" },
      { hex: "#FFE680", nombre: "Amarillo claro" },
      { hex: "#FFA060", nombre: "Durazno cálido" },
      { hex: "#A8D870", nombre: "Verde primavera" },
      { hex: "#FFD060", nombre: "Amarillo mantequilla" },
      { hex: "#FF8C70", nombre: "Salmón vivo" },
      { hex: "#88C898", nombre: "Verde menta cálido" },
      { hex: "#FFC080", nombre: "Albaricoque" },
      { hex: "#E8B870", nombre: "Miel clara" },
    ],
    apagan: ["negro puro", "gris frío", "azul marino", "burdeos oscuro", "blanco frío"],
    jewelry: "gold_yellow",
    lipstick: { name: "melocotón", hex: "#E8785A" },
    blush: { name: "coral suave", hex: "#FFB49A" },
    metal: "oro cálido siempre",
    validationPhrase:
      "All warm, bright, luminous — True Spring is never muted or cool.",
    makeupPalettes: {
      lipstick: [
        { hex: "#E8785A", nombre: "Melocotón vivo" },
        { hex: "#FF7F5C", nombre: "Coral cálido" },
        { hex: "#FF6040", nombre: "Coral mandarina" },
        { hex: "#E85838", nombre: "Salmón intenso" },
        { hex: "#F08060", nombre: "Durazno luminoso" },
      ],
      blush: [
        { hex: "#FFB49A", nombre: "Coral suave" },
        { hex: "#FF9878", nombre: "Melocotón rosado" },
        { hex: "#F0A088", nombre: "Albaricoque" },
      ],
      eyeshadow: [
        { hex: "#F5E6C8", nombre: "Crema dorada" },
        { hex: "#E8B870", nombre: "Miel clara" },
        { hex: "#C49060", nombre: "Bronce cálido" },
        { hex: "#88C898", nombre: "Verde menta cálido" },
        { hex: "#FFC080", nombre: "Albaricoque luminoso" },
        { hex: "#A87850", nombre: "Caramelo dorado" },
      ],
      eyeliner: [
        { hex: "#5C3820", nombre: "Marrón cálido" },
        { hex: "#3C2820", nombre: "Café espresso cálido" },
        { hex: "#88683C", nombre: "Bronce profundo" },
      ],
      foundation: [
        { hex: "#F8D8B8", nombre: "Marfil cálido (claro)" },
        { hex: "#E8C098", nombre: "Beige melocotón (medio)" },
        { hex: "#D8A878", nombre: "Beige dorado (oscuro)" },
      ],
    },
  },

  light_spring: {
    id: "light_spring",
    displayName: "Light Spring",
    hue: "warm",
    value: "light",
    chroma: "muted",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#FFD0B8", nombre: "Melocotón pálido" },
      { hex: "#FFB8A0", nombre: "Coral luminoso suave" },
      { hex: "#B8E0C8", nombre: "Verde menta" },
      { hex: "#F8E8D0", nombre: "Crema cálida" },
      { hex: "#FFE0C8", nombre: "Beige melocotón" },
      { hex: "#F0D0A8", nombre: "Arena dorada clara" },
      { hex: "#D0E0B8", nombre: "Verde lima suave" },
      { hex: "#FFC8B8", nombre: "Rosa coral pálido" },
      { hex: "#F8D8A8", nombre: "Amarillo trigo" },
      { hex: "#E0C8A0", nombre: "Caramelo claro" },
      { hex: "#FFE8B8", nombre: "Vainilla cálida" },
      { hex: "#E8D0B0", nombre: "Champaña" },
    ],
    apagan: ["colores oscuros o muy saturados", "negro"],
    jewelry: "gold_yellow",
    lipstick: { name: "coral pálido", hex: "#FFB8A0" },
    validationPhrase:
      "All warm, light, soft — Light Spring is never deep or saturated.",
    makeupPalettes: {
      lipstick: [
        { hex: "#FFB098", nombre: "Coral pálido" },
        { hex: "#E8A890", nombre: "Melocotón claro" },
        { hex: "#F0A080", nombre: "Salmón pastel" },
        { hex: "#E89878", nombre: "Durazno suave" },
        { hex: "#D89888", nombre: "Rosa coral apagado" },
      ],
      blush: [
        { hex: "#FFC8B8", nombre: "Rosa coral pálido" },
        { hex: "#F8B8A0", nombre: "Melocotón pastel" },
        { hex: "#F0A898", nombre: "Coral suave" },
      ],
      eyeshadow: [
        { hex: "#F8E8D0", nombre: "Vainilla cálida" },
        { hex: "#F0D0A8", nombre: "Arena dorada clara" },
        { hex: "#E0C8A0", nombre: "Caramelo claro" },
        { hex: "#D8B898", nombre: "Beige tostado claro" },
        { hex: "#B8E0C8", nombre: "Verde menta" },
        { hex: "#B89878", nombre: "Topo cálido claro" },
      ],
      eyeliner: [
        { hex: "#785838", nombre: "Marrón miel" },
        { hex: "#604838", nombre: "Café cálido suave" },
        { hex: "#503820", nombre: "Castaño claro" },
      ],
      foundation: [
        { hex: "#F8E0C8", nombre: "Porcelana cálida (claro)" },
        { hex: "#F0D0B0", nombre: "Marfil dorado (medio)" },
        { hex: "#E0BC98", nombre: "Beige claro cálido (oscuro)" },
      ],
    },
  },

  bright_spring: {
    id: "bright_spring",
    displayName: "Bright Spring",
    hue: "warm",
    value: "light",
    chroma: "bright",
    typicalFitzpatrick: [2],
    irradian: [
      { hex: "#FF6040", nombre: "Coral vivo" },
      { hex: "#40C8C8", nombre: "Turquesa cálido" },
      { hex: "#F0E020", nombre: "Amarillo limón" },
      { hex: "#60D040", nombre: "Verde brillante" },
      { hex: "#FF8030", nombre: "Naranja mandarina" },
      { hex: "#FFD030", nombre: "Amarillo girasol" },
      { hex: "#20B0E0", nombre: "Azul aqua vivo" },
      { hex: "#E83080", nombre: "Fucsia cálido" },
      { hex: "#FF5060", nombre: "Rojo coral" },
      { hex: "#80E0C0", nombre: "Turquesa luminoso" },
      { hex: "#A0D830", nombre: "Verde lima vivo" },
      { hex: "#FF9050", nombre: "Durazno vivo" },
    ],
    apagan: ["tonos apagados o muted", "negro"],
    jewelry: "gold_yellow",
    lipstick: { name: "coral vivo", hex: "#FF6040" },
    validationPhrase:
      "All warm, light, bright — Bright Spring is never muted or earthy.",
    makeupPalettes: {
      lipstick: [
        { hex: "#FF6040", nombre: "Coral vivo" },
        { hex: "#FF5060", nombre: "Rojo coral brillante" },
        { hex: "#E83080", nombre: "Fucsia cálido vivo" },
        { hex: "#FF8030", nombre: "Naranja mandarina vivo" },
        { hex: "#FF4878", nombre: "Frambuesa cálido" },
      ],
      blush: [
        { hex: "#FF9070", nombre: "Coral vivo medio" },
        { hex: "#FFB098", nombre: "Melocotón brillante" },
        { hex: "#F8A080", nombre: "Salmón vivo" },
      ],
      eyeshadow: [
        { hex: "#FFD030", nombre: "Amarillo girasol" },
        { hex: "#40C8C8", nombre: "Turquesa cálido" },
        { hex: "#80E0C0", nombre: "Turquesa luminoso" },
        { hex: "#60D040", nombre: "Verde brillante" },
        { hex: "#FFC080", nombre: "Albaricoque brillante" },
        { hex: "#A85020", nombre: "Cobre vivo" },
      ],
      eyeliner: [
        { hex: "#3C2820", nombre: "Café espresso cálido" },
        { hex: "#5C3820", nombre: "Marrón cálido intenso" },
        { hex: "#1A1208", nombre: "Negro cálido" },
      ],
      foundation: [
        { hex: "#F8D8B0", nombre: "Marfil cálido brillante (claro)" },
        { hex: "#E8B888", nombre: "Beige melocotón vivo (medio)" },
        { hex: "#D89868", nombre: "Dorado intenso (oscuro)" },
      ],
    },
  },

  dark_spring: {
    id: "dark_spring",
    displayName: "Dark Spring",
    hue: "warm",
    value: "medium",
    chroma: "clear",
    typicalFitzpatrick: [3, 4],
    irradian: [
      { hex: "#E85C30", nombre: "Coral vivo cálido" },
      { hex: "#00A06A", nombre: "Verde esmeralda cálido" },
      { hex: "#00B8C0", nombre: "Turquesa cálido" },
      { hex: "#D89020", nombre: "Dorado intenso" },
      { hex: "#C04020", nombre: "Rojo tomate" },
      { hex: "#A8C830", nombre: "Verde lima dorado" },
      { hex: "#E0A030", nombre: "Ámbar vivo" },
      { hex: "#783818", nombre: "Castaño chocolate" },
      { hex: "#B85838", nombre: "Teja brillante" },
      { hex: "#388048", nombre: "Verde bosque cálido" },
      { hex: "#D0C040", nombre: "Amarillo mostaza claro" },
      { hex: "#A02830", nombre: "Rojo cereza cálido" },
    ],
    apagan: ["colores apagados", "negro puro", "gris frío", "pasteles fríos"],
    jewelry: "gold_yellow",
    lipstick: { name: "coral cálido vivo", hex: "#E85C30" },
    validationPhrase:
      "All warm, clear, and medium-deep — Dark Spring is never cool or muted.",
    makeupPalettes: {
      lipstick: [
        { hex: "#E85C30", nombre: "Coral vivo cálido" },
        { hex: "#C04020", nombre: "Rojo tomate cálido" },
        { hex: "#A02830", nombre: "Rojo cereza cálido" },
        { hex: "#D04830", nombre: "Naranja rojizo intenso" },
        { hex: "#B83838", nombre: "Rojo carmín cálido" },
      ],
      blush: [
        { hex: "#E08868", nombre: "Coral vivo medio" },
        { hex: "#D07858", nombre: "Salmón intenso cálido" },
        { hex: "#C86848", nombre: "Terracota viva" },
      ],
      eyeshadow: [
        { hex: "#D89020", nombre: "Dorado intenso" },
        { hex: "#00A06A", nombre: "Verde esmeralda cálido" },
        { hex: "#00B8C0", nombre: "Turquesa cálido" },
        { hex: "#388048", nombre: "Verde bosque cálido" },
        { hex: "#E0A030", nombre: "Ámbar vivo" },
        { hex: "#783818", nombre: "Castaño chocolate" },
      ],
      eyeliner: [
        { hex: "#2A1810", nombre: "Negro cálido" },
        { hex: "#3C2820", nombre: "Café espresso cálido" },
        { hex: "#583020", nombre: "Marrón intenso" },
      ],
      foundation: [
        { hex: "#E0B898", nombre: "Beige dorado vivo (claro)" },
        { hex: "#B88868", nombre: "Bronce intenso (medio)" },
        { hex: "#8C6048", nombre: "Caoba cálido (oscuro)" },
      ],
    },
  },

  true_summer: {
    id: "true_summer",
    displayName: "True Summer",
    hue: "cool",
    value: "light",
    chroma: "muted",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#D8A8B8", nombre: "Rosa polvoso" },
      { hex: "#B8B0D0", nombre: "Lavanda suave" },
      { hex: "#8090A8", nombre: "Azul pizarra" },
      { hex: "#C0B0B0", nombre: "Gris rosado" },
      { hex: "#A8C0D0", nombre: "Azul polvo" },
      { hex: "#C8B8C8", nombre: "Malva claro" },
      { hex: "#B0A8B8", nombre: "Gris lavanda" },
      { hex: "#D8C0C8", nombre: "Rosa cuarzo frío" },
      { hex: "#98A8B0", nombre: "Azul humo" },
      { hex: "#C8D0D8", nombre: "Gris perla frío" },
      { hex: "#A8B0C0", nombre: "Azul cenizo" },
      { hex: "#B8C8D0", nombre: "Azul brumoso" },
    ],
    apagan: ["colores cálidos intensos", "naranja", "mostaza"],
    jewelry: "silver",
    lipstick: { name: "rosa polvoso", hex: "#C87890" },
    validationPhrase:
      "All cool and soft — True Summer is never warm or vivid.",
    makeupPalettes: {
      lipstick: [
        { hex: "#C87890", nombre: "Rosa polvoso" },
        { hex: "#B86878", nombre: "Rosa fresa apagado" },
        { hex: "#A86878", nombre: "Mauve clásico" },
        { hex: "#C880A0", nombre: "Rosa cuarzo medio" },
        { hex: "#B07088", nombre: "Rosa antiguo frío" },
      ],
      blush: [
        { hex: "#D8A8B8", nombre: "Rosa polvo frío" },
        { hex: "#C898A8", nombre: "Malva claro" },
        { hex: "#D898A8", nombre: "Rosa cuarzo frío" },
      ],
      eyeshadow: [
        { hex: "#C8D0D8", nombre: "Gris perla frío" },
        { hex: "#B8B0D0", nombre: "Lavanda suave" },
        { hex: "#A8B0C0", nombre: "Azul cenizo" },
        { hex: "#C8B8C8", nombre: "Malva claro" },
        { hex: "#A8A0A8", nombre: "Topo frío" },
        { hex: "#8090A8", nombre: "Azul pizarra" },
      ],
      eyeliner: [
        { hex: "#484850", nombre: "Gris carbón" },
        { hex: "#383848", nombre: "Azul marino apagado" },
        { hex: "#504858", nombre: "Gris violáceo" },
      ],
      foundation: [
        { hex: "#F0D8D0", nombre: "Porcelana rosada (claro)" },
        { hex: "#E0C0B8", nombre: "Beige rosado neutro (medio)" },
        { hex: "#C8A098", nombre: "Beige frío (oscuro)" },
      ],
    },
  },

  soft_summer: {
    id: "soft_summer",
    displayName: "Soft Summer",
    hue: "cool",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [2, 3],
    irradian: [
      { hex: "#A88898", nombre: "Malva apagado" },
      { hex: "#7888A0", nombre: "Azul grisáceo" },
      { hex: "#B89898", nombre: "Rosa antiguo" },
      { hex: "#9890A0", nombre: "Gris cálido" },
      { hex: "#809890", nombre: "Verde salvia frío" },
      { hex: "#A8A0A8", nombre: "Gris violeta" },
      { hex: "#909098", nombre: "Gris azulado" },
      { hex: "#B0A098", nombre: "Topo apagado" },
      { hex: "#9888A0", nombre: "Lavanda apagada" },
      { hex: "#A09898", nombre: "Beige rosado frío" },
      { hex: "#8898A8", nombre: "Azul polvo medio" },
      { hex: "#B0A0A8", nombre: "Rosa humo" },
    ],
    apagan: ["colores vivos", "negro puro", "naranja"],
    jewelry: "silver_oxidized",
    lipstick: { name: "malva suave", hex: "#C090A0" },
    validationPhrase:
      "All cool, muted, balanced — Soft Summer is never bright or warm.",
    makeupPalettes: {
      lipstick: [
        { hex: "#C090A0", nombre: "Malva suave" },
        { hex: "#B07888", nombre: "Rosa antiguo medio" },
        { hex: "#A88898", nombre: "Mauve apagado" },
        { hex: "#A07080", nombre: "Ciruela apagada" },
        { hex: "#B88098", nombre: "Rosa malva frío" },
      ],
      blush: [
        { hex: "#C098A0", nombre: "Malva polvo" },
        { hex: "#B89098", nombre: "Rosa apagado medio" },
        { hex: "#A89098", nombre: "Topo rosado frío" },
      ],
      eyeshadow: [
        { hex: "#A88898", nombre: "Malva apagado" },
        { hex: "#9890A0", nombre: "Gris cálido frío" },
        { hex: "#809890", nombre: "Verde salvia frío" },
        { hex: "#7888A0", nombre: "Azul grisáceo" },
        { hex: "#B0A0A8", nombre: "Rosa humo" },
        { hex: "#909098", nombre: "Gris azulado medio" },
      ],
      eyeliner: [
        { hex: "#4A4858", nombre: "Gris violeta profundo" },
        { hex: "#3C3848", nombre: "Carbón frío" },
        { hex: "#584858", nombre: "Ciruela carbón" },
      ],
      foundation: [
        { hex: "#E8D0C8", nombre: "Beige rosado frío (claro)" },
        { hex: "#D0B0A8", nombre: "Beige neutro frío (medio)" },
        { hex: "#A88880", nombre: "Almendra apagado (oscuro)" },
      ],
    },
  },

  light_summer: {
    id: "light_summer",
    displayName: "Light Summer",
    hue: "cool",
    value: "light",
    chroma: "clear",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#A8C5E8", nombre: "Azul cielo suave" },
      { hex: "#D8B8D0", nombre: "Lavanda clara" },
      { hex: "#F0D0DC", nombre: "Rosa polvo claro" },
      { hex: "#C8D8E0", nombre: "Gris azulado claro" },
      { hex: "#E8E0D8", nombre: "Marfil frío" },
      { hex: "#A8B8C8", nombre: "Azul pizarra claro" },
      { hex: "#B8C8D8", nombre: "Azul perla" },
      { hex: "#D0C0D8", nombre: "Violeta pálido" },
      { hex: "#C8E0D0", nombre: "Menta suave" },
      { hex: "#E0C8D0", nombre: "Rosa cuarzo" },
      { hex: "#B0C0D0", nombre: "Azul humo" },
      { hex: "#D8D0E0", nombre: "Lila brumoso" },
    ],
    apagan: ["negro puro", "naranja saturado", "mostaza", "colores cálidos vivos"],
    jewelry: "silver",
    lipstick: { name: "rosa polvo claro", hex: "#F0D0DC" },
    validationPhrase:
      "All cool, light, and clear — Light Summer is never warm or muted.",
    makeupPalettes: {
      lipstick: [
        { hex: "#D898B0", nombre: "Rosa cuarzo claro" },
        { hex: "#C880A0", nombre: "Rosa frío vivo" },
        { hex: "#E0A8B8", nombre: "Rosa polvo claro" },
        { hex: "#C098A8", nombre: "Malva claro" },
        { hex: "#D0889C", nombre: "Rosa orquídea suave" },
      ],
      blush: [
        { hex: "#F0D0DC", nombre: "Rosa polvo claro" },
        { hex: "#E0C8D0", nombre: "Rosa cuarzo" },
        { hex: "#D8B8C8", nombre: "Lavanda rosada" },
      ],
      eyeshadow: [
        { hex: "#E8E0D8", nombre: "Marfil frío" },
        { hex: "#D8D0E0", nombre: "Lila brumoso" },
        { hex: "#C8E0D0", nombre: "Menta suave" },
        { hex: "#B0C0D0", nombre: "Azul humo claro" },
        { hex: "#D0C0D8", nombre: "Violeta pálido" },
        { hex: "#A8C5E8", nombre: "Azul cielo suave" },
      ],
      eyeliner: [
        { hex: "#505868", nombre: "Gris azulado" },
        { hex: "#586878", nombre: "Azul gris medio" },
        { hex: "#484058", nombre: "Violeta carbón" },
      ],
      foundation: [
        { hex: "#F8E0DC", nombre: "Porcelana rosa fría (claro)" },
        { hex: "#F0D0CC", nombre: "Marfil rosado (medio)" },
        { hex: "#D8B8B0", nombre: "Beige rosa frío (oscuro)" },
      ],
    },
  },

  soft_winter: {
    id: "soft_winter",
    displayName: "Soft Winter",
    hue: "cool",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [1, 2],
    irradian: [
      { hex: "#A89CC8", nombre: "Lavanda" },
      { hex: "#C8C8D0", nombre: "Gris perla" },
      { hex: "#7090A8", nombre: "Azul pizarra frío" },
      { hex: "#B898A8", nombre: "Rosa malva fría" },
      { hex: "#9098B8", nombre: "Azul lavanda" },
      { hex: "#A8A8C0", nombre: "Violeta humo" },
      { hex: "#88A0B8", nombre: "Azul acero suave" },
      { hex: "#C098A8", nombre: "Rosa antiguo frío" },
      { hex: "#8898B0", nombre: "Azul grisáceo medio" },
      { hex: "#A0B0C0", nombre: "Azul niebla" },
      { hex: "#B0A0B8", nombre: "Lila brumoso" },
      { hex: "#9888A0", nombre: "Ciruela apagada" },
    ],
    apagan: ["naranja", "mostaza", "colores cálidos intensos"],
    jewelry: "silver",
    lipstick: { name: "rosa malva frío", hex: "#C87890" },
    validationPhrase:
      "All cool and muted — Soft Winter is never warm or saturated.",
    makeupPalettes: {
      lipstick: [
        { hex: "#C87890", nombre: "Rosa malva frío" },
        { hex: "#B06880", nombre: "Ciruela apagada media" },
        { hex: "#A87090", nombre: "Rosa orquídea apagado" },
        { hex: "#984868", nombre: "Vino apagado" },
        { hex: "#B88098", nombre: "Rosa frambuesa frío" },
      ],
      blush: [
        { hex: "#B898A8", nombre: "Rosa malva fría" },
        { hex: "#C098B0", nombre: "Mauve rosado frío" },
        { hex: "#A89098", nombre: "Rosa apagado frío" },
      ],
      eyeshadow: [
        { hex: "#C8C8D0", nombre: "Gris perla" },
        { hex: "#A89CC8", nombre: "Lavanda" },
        { hex: "#7090A8", nombre: "Azul pizarra frío" },
        { hex: "#A8A8C0", nombre: "Violeta humo" },
        { hex: "#9098B8", nombre: "Azul lavanda medio" },
        { hex: "#9888A0", nombre: "Ciruela apagada" },
      ],
      eyeliner: [
        { hex: "#383848", nombre: "Azul marino apagado" },
        { hex: "#3C3848", nombre: "Carbón violáceo" },
        { hex: "#484058", nombre: "Violeta profundo" },
      ],
      foundation: [
        { hex: "#F0D8D8", nombre: "Porcelana rosa fría (claro)" },
        { hex: "#E0C0C0", nombre: "Beige rosado frío (medio)" },
        { hex: "#C8A0A0", nombre: "Beige rosa apagado (oscuro)" },
      ],
    },
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
      { hex: "#000000", nombre: "Negro absoluto" },
      { hex: "#FFFFFF", nombre: "Blanco puro" },
      { hex: "#0F52BA", nombre: "Azul zafiro" },
      { hex: "#DC1A2D", nombre: "Rojo puro" },
      { hex: "#D02380", nombre: "Fucsia frío" },
      { hex: "#1C1C2E", nombre: "Azul medianoche" },
      { hex: "#5C0A6B", nombre: "Púrpura intenso" },
      { hex: "#006B5C", nombre: "Verde esmeralda frío" },
      { hex: "#B80024", nombre: "Rojo cardenal" },
      { hex: "#2050A0", nombre: "Azul real" },
      { hex: "#001848", nombre: "Azul marino profundo" },
      { hex: "#8C0040", nombre: "Magenta intenso" },
    ],
    apagan: ["tonos tierra", "colores cálidos", "muted"],
    jewelry: "silver",
    lipstick: { name: "rojo cereza", hex: "#CC2244" },
    // validationPhrase literal del Apéndice B (bajo alias "Clear Winter").
    validationPhrase:
      "All cool and clear — Clear Winter is high contrast always. Never warm, never muted.",
    makeupPalettes: {
      lipstick: [
        { hex: "#CC2244", nombre: "Rojo cereza frío" },
        { hex: "#B80048", nombre: "Frambuesa fría" },
        { hex: "#D02380", nombre: "Fucsia frío" },
        { hex: "#8B0040", nombre: "Vino tinto frío" },
        { hex: "#A8002C", nombre: "Rojo carmesí frío" },
      ],
      blush: [
        { hex: "#C84878", nombre: "Rosa fucsia frío" },
        { hex: "#B85878", nombre: "Frambuesa media" },
        { hex: "#D0688C", nombre: "Rosa cool vivo" },
      ],
      eyeshadow: [
        { hex: "#FFFFFF", nombre: "Blanco puro" },
        { hex: "#C8C8D0", nombre: "Gris plata frío" },
        { hex: "#5C0A6B", nombre: "Púrpura intenso" },
        { hex: "#006B5C", nombre: "Esmeralda frío" },
        { hex: "#0F52BA", nombre: "Azul zafiro" },
        { hex: "#1C1C2E", nombre: "Azul medianoche" },
      ],
      eyeliner: [
        { hex: "#000000", nombre: "Negro absoluto" },
        { hex: "#1A1A2A", nombre: "Azul marino profundo" },
        { hex: "#2A2030", nombre: "Berenjena oscura" },
      ],
      foundation: [
        { hex: "#E8C8B8", nombre: "Beige neutro frío (claro)" },
        { hex: "#C8A088", nombre: "Beige medio neutro-frío (medio)" },
        { hex: "#A07868", nombre: "Caramelo frío (oscuro)" },
      ],
    },
  },

  deep_winter: {
    id: "deep_winter",
    displayName: "Deep Winter",
    hue: "cool",
    value: "dark",
    chroma: "muted",
    typicalFitzpatrick: [5, 6],
    irradian: [
      { hex: "#4A1B2A", nombre: "Borgoña frío" },
      { hex: "#0A1A3A", nombre: "Azul marino profundo" },
      { hex: "#000000", nombre: "Negro absoluto" },
      { hex: "#0A4838", nombre: "Esmeralda frío" },
      { hex: "#3A1838", nombre: "Ciruela oscura" },
      { hex: "#1A1A1A", nombre: "Negro carbón" },
      { hex: "#2A0A28", nombre: "Berenjena profunda" },
      { hex: "#1A2838", nombre: "Azul medianoche oscuro" },
      { hex: "#380A20", nombre: "Vino oscuro" },
      { hex: "#0A2828", nombre: "Verde botella" },
      { hex: "#2A1838", nombre: "Violeta profundo" },
      { hex: "#382828", nombre: "Caoba frío" },
    ],
    apagan: ["colores cálidos", "pasteles", "tonos tierra"],
    jewelry: "silver",
    lipstick: { name: "ciruela oscura", hex: "#3A1838" },
    validationPhrase:
      "All cool and deep — Deep Winter is never warm or light.",
    makeupPalettes: {
      lipstick: [
        { hex: "#581838", nombre: "Ciruela oscura" },
        { hex: "#4A1B2A", nombre: "Borgoña frío" },
        { hex: "#8B0040", nombre: "Vino tinto profundo" },
        { hex: "#6B1838", nombre: "Frambuesa oscura" },
        { hex: "#3A1828", nombre: "Berenjena vino" },
      ],
      blush: [
        { hex: "#A04868", nombre: "Rosa vino apagado" },
        { hex: "#883858", nombre: "Ciruela media" },
        { hex: "#984868", nombre: "Frambuesa apagada" },
      ],
      eyeshadow: [
        { hex: "#C8C8D0", nombre: "Gris plata frío" },
        { hex: "#3A1838", nombre: "Ciruela oscura" },
        { hex: "#0A4838", nombre: "Esmeralda frío profundo" },
        { hex: "#0A1A3A", nombre: "Azul marino profundo" },
        { hex: "#2A1838", nombre: "Violeta profundo" },
        { hex: "#382828", nombre: "Caoba frío" },
      ],
      eyeliner: [
        { hex: "#000000", nombre: "Negro absoluto" },
        { hex: "#0A0A20", nombre: "Negro azulado" },
        { hex: "#1A1A1A", nombre: "Negro carbón" },
      ],
      foundation: [
        { hex: "#C8A088", nombre: "Beige neutro frío profundo (claro)" },
        { hex: "#9C7860", nombre: "Caramelo frío profundo (medio)" },
        { hex: "#6C5040", nombre: "Chocolate frío (oscuro)" },
      ],
    },
  },

  bright_winter: {
    id: "bright_winter",
    displayName: "Bright Winter",
    hue: "cool",
    value: "dark",
    chroma: "bright",
    typicalFitzpatrick: [3, 4, 5],
    irradian: [
      { hex: "#000000", nombre: "Negro absoluto" },
      { hex: "#FFFFFF", nombre: "Blanco puro" },
      { hex: "#E8002C", nombre: "Rojo intenso" },
      { hex: "#0048C4", nombre: "Azul real brillante" },
      { hex: "#00A878", nombre: "Verde esmeralda vivo" },
      { hex: "#F02888", nombre: "Fucsia eléctrico" },
      { hex: "#FFD800", nombre: "Amarillo limón vivo" },
      { hex: "#7028B8", nombre: "Púrpura intenso" },
      { hex: "#00C0E0", nombre: "Turquesa frío vivo" },
      { hex: "#1A1A1A", nombre: "Negro carbón" },
      { hex: "#C00038", nombre: "Rojo cardenal" },
      { hex: "#001870", nombre: "Azul medianoche eléctrico" },
    ],
    apagan: ["beige", "mostaza apagada", "tonos tierra", "colores muted"],
    jewelry: "silver",
    lipstick: { name: "rojo intenso", hex: "#E8002C" },
    validationPhrase:
      "All cool, dark, and bright — Bright Winter is never muted or warm.",
    makeupPalettes: {
      lipstick: [
        { hex: "#E8002C", nombre: "Rojo intenso frío" },
        { hex: "#F02888", nombre: "Fucsia eléctrico" },
        { hex: "#C00038", nombre: "Rojo cardenal" },
        { hex: "#D02060", nombre: "Frambuesa vivo frío" },
        { hex: "#8C0040", nombre: "Magenta intenso" },
      ],
      blush: [
        { hex: "#E04878", nombre: "Rosa vivo frío" },
        { hex: "#C83888", nombre: "Fucsia medio" },
        { hex: "#D8588C", nombre: "Frambuesa brillante" },
      ],
      eyeshadow: [
        { hex: "#FFFFFF", nombre: "Blanco puro" },
        { hex: "#7028B8", nombre: "Púrpura vivo" },
        { hex: "#00A878", nombre: "Verde esmeralda vivo" },
        { hex: "#00C0E0", nombre: "Turquesa eléctrico" },
        { hex: "#0048C4", nombre: "Azul real" },
        { hex: "#FFD800", nombre: "Amarillo limón vivo" },
      ],
      eyeliner: [
        { hex: "#000000", nombre: "Negro absoluto" },
        { hex: "#001870", nombre: "Azul medianoche eléctrico" },
        { hex: "#2A0040", nombre: "Violeta profundo" },
      ],
      foundation: [
        { hex: "#E8C0A8", nombre: "Beige cool brillante (claro)" },
        { hex: "#C89880", nombre: "Beige medio cool vivo (medio)" },
        { hex: "#A07060", nombre: "Caramelo cool intenso (oscuro)" },
      ],
    },
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
      { hex: "#8B3A2A", nombre: "Teja" },
      { hex: "#B8860B", nombre: "Mostaza" },
      { hex: "#6B7C45", nombre: "Verde oliva" },
      { hex: "#C4622A", nombre: "Siena" },
      { hex: "#A85020", nombre: "Naranja quemado" },
      { hex: "#7C4A20", nombre: "Marrón cobrizo" },
      { hex: "#C48848", nombre: "Caramelo cálido" },
      { hex: "#9C8038", nombre: "Oro antiguo" },
      { hex: "#5C6838", nombre: "Verde musgo" },
      { hex: "#A04830", nombre: "Ladrillo" },
      { hex: "#806020", nombre: "Bronce mate" },
      { hex: "#D89048", nombre: "Ámbar dorado" },
    ],
    apagan: ["negro puro", "blanco brillante", "colores fríos"],
    jewelry: "bronze",
    lipstick: { name: "terracota", hex: "#C4622A" },
    // Apéndice B usa "Warm Autumn" — phrase canónica para true_autumn.
    validationPhrase:
      "All warm, rich, earthy — Warm Autumn is never cool or pastel.",
    makeupPalettes: {
      lipstick: [
        { hex: "#C4622A", nombre: "Terracota" },
        { hex: "#A85020", nombre: "Naranja quemado" },
        { hex: "#9C3818", nombre: "Ladrillo cálido" },
        { hex: "#B85838", nombre: "Teja vivo" },
        { hex: "#8C3818", nombre: "Rojo óxido" },
      ],
      blush: [
        { hex: "#C48060", nombre: "Terracota suave" },
        { hex: "#B8704C", nombre: "Cobre apagado" },
        { hex: "#A86848", nombre: "Bronce mate" },
      ],
      eyeshadow: [
        { hex: "#B8860B", nombre: "Mostaza" },
        { hex: "#6B7C45", nombre: "Verde oliva" },
        { hex: "#C48848", nombre: "Caramelo cálido" },
        { hex: "#9C8038", nombre: "Oro antiguo" },
        { hex: "#806020", nombre: "Bronce profundo" },
        { hex: "#5C6838", nombre: "Verde musgo" },
      ],
      eyeliner: [
        { hex: "#3C2820", nombre: "Café espresso cálido" },
        { hex: "#5C3820", nombre: "Marrón caoba" },
        { hex: "#2A1810", nombre: "Negro cálido" },
      ],
      foundation: [
        { hex: "#E8C098", nombre: "Beige dorado (claro)" },
        { hex: "#C89870", nombre: "Caramelo cálido (medio)" },
        { hex: "#A07050", nombre: "Bronce profundo (oscuro)" },
      ],
    },
  },

  soft_autumn: {
    id: "soft_autumn",
    displayName: "Soft Autumn",
    hue: "neutral_warm",
    value: "medium",
    chroma: "muted",
    typicalFitzpatrick: [3, 4],
    irradian: [
      { hex: "#C4724A", nombre: "Terracota apagada" },
      { hex: "#C4A060", nombre: "Ocre suave" },
      { hex: "#8C9E6A", nombre: "Salvia" },
      { hex: "#C4B49A", nombre: "Arena" },
      { hex: "#A88860", nombre: "Camel" },
      { hex: "#B89878", nombre: "Topo cálido" },
      { hex: "#988868", nombre: "Caqui apagado" },
      { hex: "#C49878", nombre: "Rosa antiguo cálido" },
      { hex: "#A09078", nombre: "Lino cálido" },
      { hex: "#B08868", nombre: "Caramelo apagado" },
      { hex: "#988858", nombre: "Mostaza apagada" },
      { hex: "#C4A088", nombre: "Beige tostado" },
    ],
    apagan: ["colores brillantes o fríos"],
    jewelry: "bronze",
    lipstick: { name: "rosa antiguo apagado", hex: "#C4785A" },
    validationPhrase:
      "All muted and warm — Soft Autumn has low chroma always. Never bright, never cool.",
    makeupPalettes: {
      lipstick: [
        { hex: "#C4785A", nombre: "Rosa antiguo apagado" },
        { hex: "#B86848", nombre: "Terracota suave" },
        { hex: "#A87060", nombre: "Rosa terracota muted" },
        { hex: "#A86048", nombre: "Coral apagado profundo" },
        { hex: "#B07058", nombre: "Bronce rosado" },
      ],
      blush: [
        { hex: "#C49878", nombre: "Rosa antiguo cálido" },
        { hex: "#B88868", nombre: "Beige tostado" },
        { hex: "#C88878", nombre: "Rosa polvo cálido" },
      ],
      eyeshadow: [
        { hex: "#C4A060", nombre: "Ocre suave" },
        { hex: "#8C9E6A", nombre: "Salvia" },
        { hex: "#A88860", nombre: "Camel" },
        { hex: "#B89878", nombre: "Topo cálido" },
        { hex: "#988858", nombre: "Mostaza apagada" },
        { hex: "#988868", nombre: "Caqui apagado" },
      ],
      eyeliner: [
        { hex: "#5C4838", nombre: "Marrón apagado" },
        { hex: "#785838", nombre: "Bronce profundo apagado" },
        { hex: "#403028", nombre: "Marrón chocolate suave" },
      ],
      foundation: [
        { hex: "#E8C8B0", nombre: "Beige neutro cálido (claro)" },
        { hex: "#C8A088", nombre: "Beige oliva medio (medio)" },
        { hex: "#A07868", nombre: "Almendra tostada (oscuro)" },
      ],
    },
  },

  deep_autumn: {
    id: "deep_autumn",
    displayName: "Deep Autumn",
    hue: "warm",
    value: "dark",
    chroma: "muted",
    typicalFitzpatrick: [4, 5],
    irradian: [
      { hex: "#6B1B2A", nombre: "Borgoña" },
      { hex: "#B8860B", nombre: "Ámbar" },
      { hex: "#355E3B", nombre: "Verde cazador" },
      { hex: "#8B3A2A", nombre: "Teja oscura" },
      { hex: "#4A2820", nombre: "Chocolate profundo" },
      { hex: "#6B3818", nombre: "Caoba" },
      { hex: "#7C2820", nombre: "Rojo ladrillo profundo" },
      { hex: "#3A4A28", nombre: "Verde bosque profundo" },
      { hex: "#5C3820", nombre: "Castaño oscuro" },
      { hex: "#8C5028", nombre: "Cobre quemado" },
      { hex: "#5C1B1B", nombre: "Vino tinto" },
      { hex: "#6B5028", nombre: "Oliva oscuro" },
    ],
    apagan: ["pasteles", "colores fríos", "negro puro"],
    jewelry: "gold_antique",
    lipstick: { name: "rojo ladrillo", hex: "#7C2820" },
    validationPhrase:
      "All deep, warm, rich — Deep Autumn never cool or light.",
    makeupPalettes: {
      lipstick: [
        { hex: "#8B2A1A", nombre: "Rojo ladrillo" },
        { hex: "#6B1B2A", nombre: "Borgoña cálido" },
        { hex: "#7C2820", nombre: "Rojo ladrillo profundo" },
        { hex: "#5C1B1B", nombre: "Vino tinto cálido" },
        { hex: "#8C3818", nombre: "Teja oscura intensa" },
      ],
      blush: [
        { hex: "#A85838", nombre: "Teja apagado" },
        { hex: "#8C4830", nombre: "Cobre oscuro" },
        { hex: "#9C5040", nombre: "Ladrillo medio" },
      ],
      eyeshadow: [
        { hex: "#B8860B", nombre: "Ámbar" },
        { hex: "#355E3B", nombre: "Verde cazador" },
        { hex: "#8C5028", nombre: "Cobre quemado" },
        { hex: "#6B3818", nombre: "Caoba" },
        { hex: "#6B5028", nombre: "Oliva oscuro" },
        { hex: "#4A2820", nombre: "Chocolate profundo" },
      ],
      eyeliner: [
        { hex: "#2A1810", nombre: "Negro cálido" },
        { hex: "#3C2820", nombre: "Café espresso intenso" },
        { hex: "#1A0F08", nombre: "Negro caoba" },
      ],
      foundation: [
        { hex: "#C89878", nombre: "Beige dorado profundo (claro)" },
        { hex: "#A07050", nombre: "Bronce cálido profundo (medio)" },
        { hex: "#684830", nombre: "Chocolate cálido (oscuro)" },
      ],
    },
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
 * Validation phrase de una season. Las 14 estaciones canónicas tienen
 * phrase obligatoria — nunca retorna null. La diseñamos así para que
 * el prompt en F.2 pueda incluirla siempre sin checks defensivos.
 */
export function getValidationPhrase(seasonId: SeasonId): string {
  return SEASONS_DATABASE[seasonId].validationPhrase;
}
