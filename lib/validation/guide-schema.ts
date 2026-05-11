// =====================================================================
// Diosa Interior — Zod schemas de la guía colorimétrica
// =====================================================================
// Esquema completo del payload que Anthropic devuelve via tool use en
// el job de análisis (Bloque F). Validado con Zod en cada borde:
//  - Server: tras recibir el tool input, antes de persistir en `guides`.
//  - Server: al leer guides para renderizar la pantalla final.
//  - Tipos derivados con z.infer<typeof X> usados en componentes UI.
//
// SeasonEnum tipa contra SeasonId del knowledge base via `satisfies` —
// si seasons-database.ts agrega/quita una season y este enum no se
// actualiza, TS rompe el build.
//
// G.6.A — endurecimiento científico:
//  - SeasonEnum pasa de 11 a 14 (incluye light_summer, bright_winter,
//    dark_spring). El plan original decía "11→12" por error aritmético;
//    el conteo real es 11 + 3 = 14 (ver header de seasons-database.ts
//    para el racional de por qué 14 y no 12).
//  - UndertoneEnum cerrado a 6 valores (antes string libre).
//  - palette.avoid migra de string[] a AvoidColor[{hex, nombre}].
//  - ScientificProfileSchema usa superRefine para garantizar
//    cross-field season ↔ hue/value/chroma (antes una guía podía decir
//    "true_winter" con value=medium y pasar validación, contradiciendo
//    el canon).
//
// G.6.B — mejoras visibles:
//  - palette.colors (legacy 6 fijos) reemplazada por palette.hero (6) +
//    palette.extended (8-15 del pool irradian).
//  - palette.avoid expandido a min 8 max 12 (antes 5-10) para soportar
//    la visualización con swatches en EvitarGrid.
//  - makeup migra de {lipstick, blush?} a {narrative, categories(5)} con
//    counts fijos por categoría (lipstick:5, blush:3, eyeshadow:6,
//    eyeliner:3, foundation:3) enforzado vía superRefine.
//  - occasions promovido a bloque top-level (antes derivado de
//    palette.colors[].occasions). 6 items fijos con label, description
//    y 4-6 hex cada uno.
// =====================================================================

import { z } from "zod";

import {
  SEASONS_DATABASE,
  type SeasonId,
} from "@/lib/ai/knowledge/seasons-database";

// ---------------------------------------------------------------------
// PRIMITIVOS
// ---------------------------------------------------------------------

// 14 estaciones canónicas — debe matchear exactamente el SeasonId del
// knowledge base. El `satisfies z.ZodType<SeasonId>` falla compile-time
// si divergen.
export const SeasonEnum = z.enum([
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
]) satisfies z.ZodType<SeasonId>;

export const FitzpatrickSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const HueSchema = z.enum([
  "warm",
  "cool",
  "neutral_warm",
  "neutral_cool",
]);
export const ValueSchema = z.enum(["light", "medium", "dark"]);
export const ChromaSchema = z.enum(["clear", "bright", "muted"]);
export const ContrastSchema = z.enum(["low", "medium", "high"]);

// G.6.A — undertone cerrado a 6 valores canónicos (antes string libre).
// La IA en producción inventó "cool_neutral_olive" para una guía True
// Winter — esto cierra esa puerta. Si necesitamos un valor nuevo, se
// agrega aquí conscientemente.
export const UndertoneEnum = z.enum([
  "warm_golden",
  "warm_peach",
  "neutral_olive",
  "neutral_balanced",
  "cool_pink",
  "cool_blue",
]);

// Munsell: hue (decimal opcional) + letras + espacio + value/chroma.
// Ejemplos válidos: "5YR 6/4", "2.5YR 8/2", "7.5YR 6.5/4".
export const MunsellNotationSchema = z
  .string()
  .regex(/^\d+(\.\d+)?[A-Z]+ \d+(\.\d+)?\/\d+(\.\d+)?$/, {
    message:
      "Notación Munsell inválida (esperado: '5YR 6/4', '2.5YR 8/2', etc).",
  });

// CIE Lab: L 0-100, a/b típicamente -128 a 127 (encajan en signed 8-bit).
export const CieLabSchema = z.object({
  L: z.number().min(0).max(100),
  a: z.number().min(-128).max(127),
  b: z.number().min(-128).max(127),
});

// Hex color: # + 6 chars hexadecimales (acepta upper/lowercase).
export const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Hex inválido (esperado: '#RRGGBB').",
  });

// ---------------------------------------------------------------------
// SUB-SCHEMAS
// ---------------------------------------------------------------------

// ScientificProfileSchema con cross-field validation contra el knowledge
// base. La IA debe reportar la categorización canónica de la season que
// asignó — si dice "true_winter" debe reportar hue=cool, value=dark,
// chroma=clear. Antes de G.6.A no había enforcement: el AI escribió
// value=medium para true_winter en producción.
export const ScientificProfileSchema = z
  .object({
    fitzpatrick: FitzpatrickSchema,
    season: SeasonEnum,
    undertone: UndertoneEnum,
    hue: HueSchema,
    value: ValueSchema,
    chroma: ChromaSchema,
    munsell_notation: MunsellNotationSchema,
    cie_lab: CieLabSchema,
    contrast_level: ContrastSchema,
  })
  .superRefine((data, ctx) => {
    const canonical = SEASONS_DATABASE[data.season];
    // canonical siempre existe — SeasonEnum garantiza que data.season
    // es un id válido del KB. El check es defensivo por si KB y enum
    // divergen en runtime (shouldn't happen, pero log seguro).
    if (!canonical) return;
    if (data.hue !== canonical.hue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hue"],
        message: `Season ${data.season} must have hue=${canonical.hue}, got ${data.hue}`,
      });
    }
    if (data.value !== canonical.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: `Season ${data.season} must have value=${canonical.value}, got ${data.value}`,
      });
    }
    if (data.chroma !== canonical.chroma) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["chroma"],
        message: `Season ${data.season} must have chroma=${canonical.chroma}, got ${data.chroma}`,
      });
    }
  });

export const OccasionEnum = z.enum([
  "diario",
  "trabajo",
  "noche",
  "formal",
  "casual",
  "evento",
]);

export const PaletteColorSchema = z.object({
  hex: HexColorSchema,
  nombre: z.string().min(1),
  // Cómo y cuándo usar este color. ej: "blusas, vestidos formales".
  usage: z.string().min(1),
  // G.6.B — ahora REQUIRED. El prompt siempre la pide y las guides
  // legacy con `avoid` como string[] ya fueron borradas en producción.
  // Útil aunque las ocasiones top-level se rendericen desde
  // `guide.occasions` — cada color sigue cargando su contexto propio.
  occasions: z.array(OccasionEnum).min(1).max(4),
});

// G.6.A — palette.avoid ahora es array de {hex, nombre} en vez de
// string[]. Permite render visual con swatches en G.6.B (EvitarGrid)
// y elimina la conversión nombre→hex implícita que la IA hacía mal.
export const AvoidColorSchema = z.object({
  hex: HexColorSchema,
  nombre: z.string().min(1).max(50),
});

export const PaletteSchema = z.object({
  // G.6.B — hero (6 colores fijos) reemplaza al legacy palette.colors.
  // Son los 6 más representativos del pool irradian de la estación.
  hero: z.array(PaletteColorSchema).length(6),
  // Pool extendido 8-15 del irradian (12 hex disponibles por estación).
  // La IA elige cuántos según el balance editorial de cada paleta.
  extended: z.array(PaletteColorSchema).min(8).max(15),
  // 8-12 colores a evitar, derivados del listado `apagan` de la estación
  // canónica. El prompt pide a la IA convertir descriptores cualitativos
  // ("negro puro") a hex canónicos ("#000000") usando un mapping.
  avoid: z.array(AvoidColorSchema).min(8).max(12),
});

export const MakeupItemSchema = z.object({
  hex: HexColorSchema,
  nombre: z.string().min(1).max(50),
  // Tip opcional por color (ej. "para foco labial diurno"). La IA puede
  // omitirlo si no aporta valor.
  tip: z.string().min(10).max(140).optional(),
});

export const MakeupCategoryEnum = z.enum([
  "lipstick",
  "blush",
  "eyeshadow",
  "eyeliner",
  "foundation",
]);

export const MakeupCategorySchema = z.object({
  category: MakeupCategoryEnum,
  label: z.string().min(1).max(40),
  rationale: z.string().min(40).max(200),
  colors: z.array(MakeupItemSchema),
});

// G.6.B — 5 categorías fijas con counts canónicos: lipstick(5), blush(3),
// eyeshadow(6), eyeliner(3), foundation(3). El superRefine verifica
// presencia única de cada categoría + count correcto por categoría.
const MAKEUP_CATEGORY_COUNTS: Readonly<
  Record<z.infer<typeof MakeupCategoryEnum>, number>
> = {
  lipstick: 5,
  blush: 3,
  eyeshadow: 6,
  eyeliner: 3,
  foundation: 3,
};

export const MakeupSchema = z
  .object({
    // Texto general que introduce la paleta de maquillaje. Voz §13.
    narrative: z.string().min(80).max(400),
    categories: z.array(MakeupCategorySchema).length(5),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<z.infer<typeof MakeupCategoryEnum>>();
    data.categories.forEach((cat, i) => {
      if (seen.has(cat.category)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categories", i, "category"],
          message: `Duplicate category: ${cat.category}`,
        });
      }
      seen.add(cat.category);
      const expected = MAKEUP_CATEGORY_COUNTS[cat.category];
      if (cat.colors.length !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categories", i, "colors"],
          message: `Category ${cat.category} must have ${expected} colors, got ${cat.colors.length}`,
        });
      }
    });
    for (const required of Object.keys(MAKEUP_CATEGORY_COUNTS) as ReadonlyArray<
      z.infer<typeof MakeupCategoryEnum>
    >) {
      if (!seen.has(required)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["categories"],
          message: `Missing required category: ${required}`,
        });
      }
    }
  });

// G.6.B — occasions promovido a bloque top-level. 6 items fijos en el
// orden canónico del enum (diario, trabajo, noche, formal, casual,
// evento). Cada uno con narrativa propia + 4-6 hex sacados del pool
// extended de la paleta.
export const OccasionSchema = z.object({
  id: OccasionEnum,
  label: z.string().min(1).max(40),
  description: z.string().min(20).max(120),
  colors: z.array(HexColorSchema).min(4).max(6),
});

export const OccasionsSchema = z.array(OccasionSchema).length(6);

// JewelryType debe matchear el enum del knowledge base (lib/ai/knowledge).
export const JewelrySchema = z.object({
  type: z.enum([
    "gold_yellow",
    "gold_warm",
    "silver",
    "platinum",
    "bronze",
    "copper",
    "rose_gold",
    "gold_antique",
    "silver_oxidized",
  ]),
  rationale: z.string().min(1),
});

export const HaircutSchema = z.object({
  description: z.string().min(1),
  rationale: z.string().min(1),
});

// ---------------------------------------------------------------------
// TOP-LEVEL GUIDE
// ---------------------------------------------------------------------

export const GuideSchema = z.object({
  scientific: ScientificProfileSchema,
  palette: PaletteSchema,
  occasions: OccasionsSchema,
  makeup: MakeupSchema,
  jewelry: JewelrySchema,
  haircut: HaircutSchema,
  // Texto narrativo principal de la guía — voz §13 (íntima-experta,
  // declarativa, latinamente orgullosa). 600-1200 chars indicativo.
  rationale: z.string().min(120).max(2400),
});

// Tipos inferidos para uso en componentes / services.
export type Guide = z.infer<typeof GuideSchema>;
export type ScientificProfile = z.infer<typeof ScientificProfileSchema>;
export type Palette = z.infer<typeof PaletteSchema>;
export type PaletteColor = z.infer<typeof PaletteColorSchema>;
export type AvoidColor = z.infer<typeof AvoidColorSchema>;
export type Makeup = z.infer<typeof MakeupSchema>;
export type MakeupItem = z.infer<typeof MakeupItemSchema>;
export type MakeupCategory = z.infer<typeof MakeupCategorySchema>;
export type MakeupCategoryId = z.infer<typeof MakeupCategoryEnum>;
export type OccasionEntry = z.infer<typeof OccasionSchema>;
export type Occasions = z.infer<typeof OccasionsSchema>;
export type Jewelry = z.infer<typeof JewelrySchema>;
export type Haircut = z.infer<typeof HaircutSchema>;
export type Occasion = z.infer<typeof OccasionEnum>;
export type Undertone = z.infer<typeof UndertoneEnum>;
