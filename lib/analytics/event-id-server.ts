// =====================================================================
// Diosa Interior — Event IDs (server-only, node:crypto)
// =====================================================================
// Hash determinístico de purchase_id → event_id, usado SOLO server-side
// (CAPI events Purchase y CompleteRegistration). Importa node:crypto
// con el prefijo "node:" para que Webpack y TypeScript marquen el
// módulo explícitamente como Node — previene que se bundlee en el
// cliente.
//
// G.7.1 — split del archivo original event-id.ts. Antes, esa misma
// función vivía junto a generateEventId() en un módulo que el cliente
// importaba indirectamente, contaminando el bundle. Ahora:
//  - generateEventId()         → event-id.ts (Web Crypto, ambos contextos)
//  - eventIdFromPurchase()     → este archivo (Node crypto, server-only)
//
// La separación garantiza que ningún componente client-side pueda
// importar accidentalmente node:crypto.
// =====================================================================

import "server-only";
import { createHash } from "node:crypto";

export function eventIdFromPurchase(
  purchaseId: string,
  suffix?: string,
): string {
  const input = suffix ? `${purchaseId}::${suffix}` : purchaseId;
  // SHA-256 truncado a 32 hex chars (128 bits) — suficiente para no
  // colisionar en práctica, más legible en logs que un hash completo.
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}
