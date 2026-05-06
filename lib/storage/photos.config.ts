// Pieza CLIENT-SAFE del módulo de fotos: constantes, tipos y validators
// puros. NO importa nada que dependa de next/headers o del server-only
// Supabase client. Las server functions (uploadPhoto, deletePhoto, etc)
// viven en photos.ts y consumen estas exports.
//
// Por qué el split: client components que necesitan PHOTO_SLOTS o tipos
// no pueden importar photos.ts porque arrastra `import { cookies } from
// "next/headers"` al bundle del browser y rompe el build.

import type { Database } from "@/lib/db/database.types";

// ---------------------------------------------------------------------
// SLOTS
// ---------------------------------------------------------------------
// Replica del slide-3 V1 (instrucciones de fotos). Filosofía: fotos
// cotidianas con iluminaciones distintas le dan a la IA más info que
// fotos clínicas en setup controlado. La selfie de rostro es el slot
// "clave" (badge terra); los otros 3 son numerados.

export const PHOTO_SLOTS = [
  {
    position: 1,
    key: "selfie_rostro",
    label: "Selfie de rostro",
    sublabel: "Sin filtro · cualquier lugar",
    badge: "clave",
  },
  {
    position: 2,
    key: "look_completo",
    label: "Look completo",
    sublabel: "De cabeza a pies · ropa que te gusta",
    badge: "numbered",
  },
  {
    position: 3,
    key: "luz_diferente",
    label: "Luz diferente",
    sublabel: "Restaurante, exterior, oficina",
    badge: "numbered",
  },
  {
    position: 4,
    key: "momento_favorita",
    label: "Tu momento favorita",
    sublabel: "Evento, viaje — donde más te gustaste",
    badge: "numbered",
  },
] as const;

export type PhotoSlot = (typeof PHOTO_SLOTS)[number];
export type PhotoPosition = PhotoSlot["position"]; // 1 | 2 | 3 | 4
export type PhotoSlotKey = PhotoSlot["key"];
export type PhotoSlotBadge = PhotoSlot["badge"]; // "clave" | "numbered"

// ---------------------------------------------------------------------
// VALIDATORS
// ---------------------------------------------------------------------

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
} as const satisfies Record<string, string>;

export type AllowedMime = keyof typeof MIME_TO_EXT;

export function isAllowedMime(mime: string): mime is AllowedMime {
  return mime in MIME_TO_EXT;
}

export function mimeToExt(mime: AllowedMime): string {
  return MIME_TO_EXT[mime];
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB; matches bucket
export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 h; alcanza una sesión de upload

// ---------------------------------------------------------------------
// TIPOS DE RESULTADO
// ---------------------------------------------------------------------

export type Photo = Database["public"]["Tables"]["photos"]["Row"];

export type UploadErrorCode =
  | "invalid_mime"
  | "file_too_large"
  | "storage_failed"
  | "db_failed";

export type UploadResult =
  | { ok: true; photo: Photo }
  | { ok: false; error: UploadErrorCode; message?: string };

export type DeleteErrorCode = "storage_failed" | "db_failed";

export type DeleteResult =
  | { ok: true }
  | { ok: false; error: DeleteErrorCode; message?: string };
