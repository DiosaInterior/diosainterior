import "server-only";

import { createClient } from "@/lib/db/server";
import type { Guide } from "@/lib/validation/guide-schema";

/**
 * Lee la guide más reciente del user logueado.
 *
 * Server-only. Usa cookie auth + RLS users_own_guides (definida en
 * supabase/migrations/0001_initial.sql) — la usuaria solo puede leer
 * SUS guides.
 *
 * NOTA: el campo `data` es JSONB en Postgres → llega como objeto JS,
 * sin .parse() necesario. Tipamos el cast a Guide; F.3 ya validó la
 * shape contra GuideSchema antes de persistir.
 *
 * @returns la guide más reciente o null si el user no tiene ninguna
 *          (caso pre-análisis o error de DB).
 */
export async function getLatestGuideForUser(
  userId: string,
): Promise<Guide | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guides")
    .select("data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[G.1] Failed to load guide for user ${userId}:`, error);
    return null;
  }

  if (!data) return null;

  return data.data as Guide;
}
