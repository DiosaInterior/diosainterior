// =====================================================================
// Stripe — config y helpers (server-only)
// =====================================================================
// Constantes y helpers de configuración del flow de Stripe Checkout.
// `import 'server-only'` arriba: aunque las price IDs no son secretas,
// la lógica de "qué price se cobra y para qué producto" vive del lado
// server para que no pueda manipularse desde el cliente.
//
// Validación al boot del módulo: si STRIPE_PRICE_ID_BASE falta cuando
// se importa esto, lanzamos error claro. STRIPE_SECRET_KEY se valida
// en lib/stripe/client.ts (lazy, en getStripe()).
// =====================================================================

import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} env var. Add it to .env.local. See .env.example.`,
    );
  }
  return value;
}

// Price ID del producto único de V2 ("Diosa Interior" base, $499 MXN).
// El shape soporta más SKUs en el futuro (wedding/quinceanera/session)
// vía CHECK constraint en purchases.product, pero la migración del
// schema vive del lado DB; nuevos prices se agregan acá sin tocar
// migration.
export const STRIPE_PRICE_ID_BASE = requireEnv("STRIPE_PRICE_ID_BASE");

// Base URL pública usada para construir success_url y cancel_url al
// crear sessions de Checkout. Si NEXT_PUBLIC_APP_URL no está setteado,
// asume localhost (útil en dev). En staging/prod hay que setearlo
// explícito para que Stripe redirija a la URL correcta.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type StripeMode = "test" | "live";

/**
 * Detecta si STRIPE_SECRET_KEY apunta a Test mode (sk_test_...) o a
 * Live mode (sk_live_...). Lee env en cada llamada — no hay caching;
 * tests pueden vi.stubEnv distinto por caso.
 *
 * Uso esperado: telemetría, logs, badges en UI ("MODO TEST"). Nunca
 * para enforce de seguridad — Stripe valida el modo del lado server
 * cuando recibe la request.
 */
export function getStripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY env var.");
  }
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  throw new Error(
    `STRIPE_SECRET_KEY has unexpected prefix. Expected sk_test_... or sk_live_...; got "${key.slice(0, 8)}...".`,
  );
}

export function isTestMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
}
