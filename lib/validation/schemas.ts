// =====================================================================
// Diosa Interior V2 — Zod schemas
// =====================================================================
// Fuente única de verdad para validación de datos en bordes (P4).
// Todos los route handlers, server actions y respuestas IA validan
// contra estos schemas antes de tocar la DB.
//
// TODO (Fase 4 — AnthropicService): derivar el JSON schema para tool
// use de Anthropic desde estos Zod schemas usando `zod-to-json-schema`
// (npm). Single source of truth: el Zod. Esto evita drift entre lo que
// validamos y lo que le pedimos al modelo.
// =====================================================================

import { z } from "zod";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Hex color inválido (formato esperado: #RRGGBB)");

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha ISO inválida (formato esperado: YYYY-MM-DD)");

// ---------------------------------------------------------------------
// PURCHASE — input para crear una compra (Fase 3 — Stripe Checkout)
// ---------------------------------------------------------------------

export const createPurchaseSchema = z.object({
  product: z.enum(["base", "wedding", "quinceanera", "session"]),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("mxn"),
});
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

// ---------------------------------------------------------------------
// PHOTO — input para registrar una foto subida (Fase 2 — upload)
// ---------------------------------------------------------------------

export const createPhotoSchema = z.object({
  storagePath: z.string().min(1),
  position: z.number().int().min(1).max(4),
});
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;

// ---------------------------------------------------------------------
// BOOKING — input para crear una cita (Fase 7 — booking)
// ---------------------------------------------------------------------

export const createBookingSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  preferredDate: isoDateSchema.optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// =====================================================================
// GUIDE — estructura completa devuelta por Anthropic (Fase 4)
// =====================================================================
// Migrada literal del prompt V1. Contrato estricto: cualquier respuesta
// del modelo que no matchee este schema dispara un reintento (P4).
// =====================================================================

// --- Perfil ----------------------------------------------------------
export const perfilSchema = z.object({
  tipo: z.string().min(1),                  // ej. "Otoño Cálido Profundo"
  pills: z.array(z.string().min(1)).length(5), // 5 etiquetas cortas
  narrativa: z.string().min(1),             // párrafo descriptivo
});
export type GuidePerfil = z.infer<typeof perfilSchema>;

// --- Paleta — exactamente 6 colores ----------------------------------
export const paletaItemSchema = z.object({
  nombre: z.string().min(1),
  hex: hexColorSchema,
  desc: z.string().min(1),
  tip: z.string().min(1),
});
export type GuidePaletaItem = z.infer<typeof paletaItemSchema>;

export const paletaSchema = z.array(paletaItemSchema).length(6);
export type GuidePaleta = z.infer<typeof paletaSchema>;

// --- Evitar — exactamente 5 colores ----------------------------------
export const evitarItemSchema = z.object({
  color: hexColorSchema,
  nombre: z.string().min(1),
});
export type GuideEvitarItem = z.infer<typeof evitarItemSchema>;

export const evitarSchema = z.array(evitarItemSchema).length(5);
export type GuideEvitar = z.infer<typeof evitarSchema>;

// --- Ocasiones — exactamente 6 ----------------------------------------
export const ocasionItemSchema = z.object({
  emoji: z.string().min(1),                       // unicode normal
  nombre: z.string().min(1),                      // ej. "Día casual"
  tag: z.string().min(1),                         // categoría corta
  colores: z.array(hexColorSchema).length(5),     // 5 hex
  nombres: z.string().min(1),                     // nombres separados por coma
});
export type GuideOcasion = z.infer<typeof ocasionItemSchema>;

export const ocasionesSchema = z.array(ocasionItemSchema).length(6);
export type GuideOcasiones = z.infer<typeof ocasionesSchema>;

// --- Corte -----------------------------------------------------------
export const corteSchema = z.object({
  geometria: z.string().min(1),         // ej. "Oval suave"
  narrativa: z.string().min(1),
  si: z.array(z.string().min(1)).length(5),
  no: z.array(z.string().min(1)).length(3),
});
export type GuideCorte = z.infer<typeof corteSchema>;

// --- Maquillaje ------------------------------------------------------
export const maquillajeZonaSchema = z.object({
  zona: z.string().min(1),                              // ej. "Labios"
  colores: z.array(hexColorSchema).length(3),           // 3 colores
  valor: z.string().min(1),                             // ej. "Tonos cálidos profundos"
  marcas: z.string().min(1),                            // multilínea con \n
  full: z.boolean(),                                    // si la zona usa más espacio visual
});
export type GuideMaquillajeZona = z.infer<typeof maquillajeZonaSchema>;

export const maquillajeSchema = z.object({
  narrativa: z.string().min(1),
  zonas: z.array(maquillajeZonaSchema).length(5),
});
export type GuideMaquillaje = z.infer<typeof maquillajeSchema>;

// --- Metal -----------------------------------------------------------
// `color` es un CSS gradient ("linear-gradient(...)"). Validamos como
// string sin parsear — confiamos que Anthropic lo devuelve bien formado.
const metalEntryBaseSchema = z.object({
  nombre: z.string().min(1),
  color: z.string().min(1),
  label: z.string().min(1),
});

export const metalIdealSchema = metalEntryBaseSchema.extend({
  sub: z.string().min(1),
});
export type GuideMetalIdeal = z.infer<typeof metalIdealSchema>;

export const metalEntrySchema = metalEntryBaseSchema;
export type GuideMetalEntry = z.infer<typeof metalEntrySchema>;

export const metalSchema = z.object({
  narrativa: z.string().min(1),
  ideal: metalIdealSchema,
  secundario: metalEntrySchema,
  evitar: metalEntrySchema,
});
export type GuideMetal = z.infer<typeof metalSchema>;

// --- Guide top-level -------------------------------------------------
export const guideSchema = z.object({
  perfil: perfilSchema,
  paleta: paletaSchema,
  evitar: evitarSchema,
  ocasiones: ocasionesSchema,
  corte: corteSchema,
  maquillaje: maquillajeSchema,
  metal: metalSchema,
});
export type GuideData = z.infer<typeof guideSchema>;
