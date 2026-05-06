// =====================================================================
// Storage helpers — bucket "photos"
// =====================================================================
// Helpers server-side para subir, borrar y leer las 4 fotos de cada
// usuaria. Se montan sobre el cliente Supabase con cookies (lib/db/server)
// — corren en el contexto auth de la usuaria, así que las RLS policies
// del bucket fuerzan que solo pueda tocar paths que empiecen con su
// auth.uid(). El uploader real (route handler / server action) llega en
// D.4; este módulo expone funciones puras que ese handler invoca.
//
// Path convention: {user_id}/{position}.{ext}
//   position ∈ {1,2,3,4} — alineado con biblia §5 (CHECK + UNIQUE)
//   ext      ∈ {jpg,png,heic,webp}
//
// La validación MIME / tamaño se hace ANTES de tocar Supabase para que
// los tests puedan ejercitar el camino feliz/rechazo sin mocks.
// =====================================================================

import type { Database } from "@/lib/db/database.types";
import { createClient } from "@/lib/db/server";

// ---------------------------------------------------------------------
// SLOTS
// ---------------------------------------------------------------------

// Los 4 slots replican el slide-3 (instrucciones de fotos) de V1.
// Filosofía: fotos cotidianas con iluminaciones distintas le dan a la IA
// más información que fotos clínicas en setup controlado. La selfie de
// rostro es el slot "clave" (badge terra); los otros 3 son numerados.

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
// VALIDACIÓN
// ---------------------------------------------------------------------
// MIME → extensión: lookup table que también define el whitelist.
// `as const satisfies` mantiene los literales y obliga a que cada valor
// sea string sin perder la inferencia precisa.

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

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB; matches bucket
export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 h; alcanza una sesión de upload, se regenera al recargar
const BUCKET = "photos";

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

// ---------------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------------

/**
 * Sube una foto al bucket "photos" y persiste la referencia en `photos`.
 *
 * 1) Valida MIME y tamaño antes de tocar IO.
 * 2) Si ya existía una foto en (user_id, position) con extensión distinta
 *    a la nueva, borra el archivo viejo del bucket — best-effort: si la
 *    limpieza falla la subida sigue (genera un huérfano que se puede
 *    barrer luego). Sin esto, cambiar el MIME (ej. JPEG → PNG en el
 *    mismo slot) deja "abc/1.jpg" huérfano cuando "abc/1.png" se sube.
 * 3) Sube al bucket con upsert: true (mismo path se sobreescribe atómico).
 * 4) UPSERT en `photos` por (user_id, position) — el UNIQUE constraint
 *    fuerza que cada slot tenga a lo sumo una fila.
 *
 * Si `userId` no coincide con auth.uid(), las policies del bucket y de
 * photos rechazarán y devolveremos storage_failed/db_failed. El caller
 * (route handler) debe pasar el id de la sesión actual.
 */
export async function uploadPhoto(
  file: File,
  position: PhotoPosition,
  userId: string,
): Promise<UploadResult> {
  if (!isAllowedMime(file.type)) {
    return { ok: false, error: "invalid_mime" };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "file_too_large" };
  }

  const ext = MIME_TO_EXT[file.type];
  const storagePath = `${userId}/${position}.${ext}`;

  const supabase = await createClient();

  // Best-effort: borrar archivo huérfano si la extensión cambió respecto
  // al upload anterior en este mismo slot. Errores se ignoran — la
  // subida nueva sigue su curso.
  const { data: existing } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("position", position)
    .maybeSingle();
  if (existing && existing.storage_path !== storagePath) {
    await supabase.storage.from(BUCKET).remove([existing.storage_path]);
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });
  if (uploadError) {
    return {
      ok: false,
      error: "storage_failed",
      message: uploadError.message,
    };
  }

  const { data, error: dbError } = await supabase
    .from("photos")
    .upsert(
      {
        user_id: userId,
        position,
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "user_id,position" },
    )
    .select()
    .single();
  if (dbError || !data) {
    return {
      ok: false,
      error: "db_failed",
      message: dbError?.message,
    };
  }

  return { ok: true, photo: data };
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
// Idempotente: si no hay fila en photos, devuelve ok sin error.
// Borra primero del bucket y luego de la tabla — si el bucket falla
// devolvemos storage_failed antes de tocar la tabla. Si la tabla falla
// después de borrar el archivo, queda inconsistencia (archivo borrado,
// fila no) — caller debería reintentar deletePhoto, que es idempotente
// por el path lookup.

export async function deletePhoto(
  position: PhotoPosition,
  userId: string,
): Promise<DeleteResult> {
  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("position", position)
    .maybeSingle();
  if (lookupError) {
    return { ok: false, error: "db_failed", message: lookupError.message };
  }
  if (!existing) {
    return { ok: true };
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([existing.storage_path]);
  if (storageError) {
    return {
      ok: false,
      error: "storage_failed",
      message: storageError.message,
    };
  }

  const { error: dbError } = await supabase
    .from("photos")
    .delete()
    .eq("user_id", userId)
    .eq("position", position);
  if (dbError) {
    return { ok: false, error: "db_failed", message: dbError.message };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------
// LISTADO
// ---------------------------------------------------------------------

export async function getUserPhotos(userId: string): Promise<Photo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("user_id", userId)
    .order("position");
  if (error) {
    throw error;
  }
  return data ?? [];
}

// ---------------------------------------------------------------------
// SIGNED URL
// ---------------------------------------------------------------------

/**
 * Genera una URL firmada con TTL de 1 hora para mostrar la foto al
 * cliente. El bucket es privado: sin signed URL no hay forma de servir
 * el archivo via <img>. Defensivo: si falla retorna null en vez de
 * throw — la UI muestra un placeholder en lugar de crashear.
 */
export async function getSignedPhotoUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    return null;
  }
  return data.signedUrl;
}
