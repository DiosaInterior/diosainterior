// =====================================================================
// Stripe SDK — server-only lazy singleton
// =====================================================================
// `import 'server-only'` arriba refuerza que este módulo NUNCA viaja al
// bundle del cliente. Si algún client component lo importa por error,
// el build falla con un mensaje claro ("This module cannot be imported
// from a Client Component module"), evitando que la SECRET key se filtre.
//
// Lazy singleton: la instancia se crea en la primera llamada a getStripe()
// y se cachea para llamadas siguientes. No exportamos la instance
// directamente para que los tests puedan controlar el ciclo de vida sin
// monkey-patching del módulo.
//
// apiVersion pinned a "2026-04-22.dahlia" — la version pinned por el
// SDK v22.1.0. Subir el SDK en el futuro NO cambia la version contra
// la que hablamos hasta que actualicemos esta constante manualmente.
// =====================================================================

import "server-only";
import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-04-22.dahlia" as const;

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY env var. Add it to .env.local from your Stripe dashboard.",
    );
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return stripeInstance;
}
