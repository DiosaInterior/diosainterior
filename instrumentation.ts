// =====================================================================
// Sentry — Hook de registro server-side
// =====================================================================
// Despacha la config correcta según el runtime que Next.js esté
// arrancando (Node.js o Edge). Stable en Next.js >= 14.0.4 — en
// Next 16 es nativo, no requiere experimental flag.
// =====================================================================

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura automáticamente errores no manejados en route handlers,
// server components y server actions. Requiere @sentry/nextjs >= 8.28.0.
// Si Sentry no está inicializado (DSN vacío), es no-op.
export const onRequestError = Sentry.captureRequestError;
