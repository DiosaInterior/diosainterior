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
// =====================================================================

import { z } from "zod";

import type { SeasonId } from "@/lib/ai/knowledge/seasons-database";

// ---------------------------------------------------------------------
// PRIMITIVOS
// ---------------------------------------------------------------------

// 11 estaciones canónicas — debe matchear exactamente el SeasonId del
// knowledge base. El `satisfies z.ZodType<SeasonId>` falla compile-time
// si divergen.
export const SeasonEnum = z.enum([
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

export const ScientificProfileSchema = z.object({
  fitzpatrick: FitzpatrickSchema,
  season: SeasonEnum,
  // 'warm_golden', 'neutral_olive', 'cool_pink', etc — texto libre por
  // ahora; F.2/F.3 puede cerrarlo con enum si el modelo siempre devuelve
  // valores estables.
  undertone: z.string().min(1).max(64),
  hue: HueSchema,
  value: ValueSchema,
  chroma: ChromaSchema,
  munsell_notation: MunsellNotationSchema,
  cie_lab: CieLabSchema,
  contrast_level: ContrastSchema,
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
  // Categoría estructurada de ocasiones donde brilla el color.
  // Min 1, max 4 — un color rara vez sirve para >4 contextos.
  // Cubre los contextos más comunes en LATAM. Permite OcasionesGrid (G.2).
  //
  // Optional a nivel Zod para no romper guides legacy en BD (las creadas
  // antes de G.2.0 NO tienen este campo). El prompt sí lo pide REQUIRED
  // a Anthropic — guides nuevas siempre llegan con occasions populadas.
  // UI G.2 hace defensive render: `color.occasions ?? []`.
  occasions: z.array(OccasionEnum).min(1).max(4).optional(),
});

export const PaletteSchema = z.object({
  // 6 colores base — biblia §slide-1 de V1: "6 colores exactamente tuyos".
  colors: z.array(PaletteColorSchema).length(6),
  avoid: z.array(z.string().min(1)).min(1),
});

export const MakeupItemSchema = z.object({
  name: z.string().min(1),
  hex: HexColorSchema,
});

export const MakeupSchema = z.object({
  lipstick: MakeupItemSchema,
  blush: MakeupItemSchema.optional(),
});

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
export type Makeup = z.infer<typeof MakeupSchema>;
export type MakeupItem = z.infer<typeof MakeupItemSchema>;
export type Jewelry = z.infer<typeof JewelrySchema>;
export type Haircut = z.infer<typeof HaircutSchema>;
export type Occasion = z.infer<typeof OccasionEnum>;
