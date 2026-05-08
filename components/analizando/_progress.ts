// Utilities puras (no React) para mapear substage del job a feedback
// visual: % de progreso + copy. Aisladas en un módulo separado para
// poder unit-testear sin montar componente.

export type Substage =
  | "pending"
  | "loading_photos"
  | "calling_ai"
  | "persisting"
  | "done"
  | "failed";

export type Status = "queued" | "running" | "succeeded" | "failed";

const SUBSTAGE_BASE_PERCENT: Record<Substage, number> = {
  pending: 0,
  loading_photos: 15,
  calling_ai: 30,
  persisting: 92,
  done: 100,
  failed: 0,
};

const SUBSTAGE_COPY: Record<Substage, string> = {
  pending: "Leyendo tu piel.",
  loading_photos: "Leyendo tu piel.",
  calling_ai: "Encontrando tu temperatura.",
  persisting: "Eligiendo tu paleta.",
  done: "Tu guía está lista.",
  failed: "Algo no salió como esperábamos.",
};

// Duración observada en F.5 smoke (~22s desde calling_ai → persisting).
// Si en producción el promedio diverge >30%, ajustar acá sin cambiar
// el resto del flow.
const CALLING_AI_DURATION_MS = 22_000;
const CALLING_AI_BASE_PERCENT = 30;
const CALLING_AI_MAX_PERCENT = 85;

/**
 * Calcula el % de progreso visible en la barra.
 *
 * Para todos los substages excepto `calling_ai`, retorna el % base
 * (mapeo discreto). Para `calling_ai` (el step largo del AI request)
 * interpola linealmente entre 30% y 85% según tiempo elapsed dentro
 * del substage — evita la barra "congelada" durante los ~22s del call.
 *
 * @param substage substage actual del job
 * @param substageStartedAt timestamp ISO de cuando entró el substage
 *                          actual (null si todavía no se observó).
 */
export function calcProgressPercent(
  substage: Substage,
  substageStartedAt: string | null,
): number {
  if (substage !== "calling_ai") {
    return SUBSTAGE_BASE_PERCENT[substage];
  }

  if (!substageStartedAt) return CALLING_AI_BASE_PERCENT;

  const elapsedMs = Date.now() - new Date(substageStartedAt).getTime();
  const ratio = Math.min(1, Math.max(0, elapsedMs / CALLING_AI_DURATION_MS));
  const interpolated =
    CALLING_AI_BASE_PERCENT +
    ratio * (CALLING_AI_MAX_PERCENT - CALLING_AI_BASE_PERCENT);

  return Math.round(interpolated);
}

/**
 * Copy declarativa para el substage actual. Sin coach voice, sin
 * promesas — voz §13 de la BIBLIA.
 */
export function copyForSubstage(substage: Substage): string {
  return SUBSTAGE_COPY[substage];
}
