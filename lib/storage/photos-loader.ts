import "server-only";
import { getAdminClient } from "@/lib/db/admin";

export type Base64Photo = {
  data: string; // raw base64, sin prefix data:...
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  position: 1 | 2 | 3 | 4;
};

const BUCKET = "photos";

/**
 * Determines mime type from storage path extension.
 * Defaults to image/jpeg (F.0.2 normalizes HEIC → JPEG).
 */
function mimeTypeFromPath(path: string): Base64Photo["mediaType"] {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg"; // default
}

/**
 * Carga las 4 fotos del usuario desde Supabase Storage y las
 * convierte a base64 para envío a Anthropic.
 *
 * Lee la tabla photos filtrada por user_id, ordenada por position.
 * Por cada fila, descarga el blob del bucket y lo convierte a base64.
 *
 * Throws si:
 * - DB query falla
 * - No hay exactamente 4 fotos (la app garantiza 4 antes de crear job)
 * - Cualquier descarga de storage falla
 */
export async function loadPhotosForUser(
  userId: string,
): Promise<Base64Photo[]> {
  const supabase = getAdminClient();

  const { data: photos, error } = await supabase
    .from("photos")
    .select("storage_path, position")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load photos for user ${userId}: ${error.message}`,
    );
  }
  if (!photos || photos.length !== 4) {
    throw new Error(
      `Expected 4 photos for user ${userId}, got ${photos?.length ?? 0}`,
    );
  }

  const result: Base64Photo[] = [];
  for (const photo of photos) {
    const { data: blob, error: dlError } = await supabase.storage
      .from(BUCKET)
      .download(photo.storage_path);
    if (dlError || !blob) {
      throw new Error(
        `Failed to download photo ${photo.storage_path}: ${dlError?.message ?? "no blob"}`,
      );
    }
    const buffer = Buffer.from(await blob.arrayBuffer());
    result.push({
      data: buffer.toString("base64"),
      mediaType: mimeTypeFromPath(photo.storage_path),
      position: photo.position as 1 | 2 | 3 | 4,
    });
  }

  return result;
}
