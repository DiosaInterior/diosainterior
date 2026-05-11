// =====================================================================
// Diosa Interior — Event IDs para deduplicación / idempotencia Meta
// =====================================================================
// Helpers para generar event_id de los eventos Meta Pixel + CAPI.
//
// G.7 — dos modos:
//  - generateEventId(): UUID v4 random, para eventos client-side
//    (InitiateCheckout). No es persistido, no hace falta dedup.
//  - eventIdFromPurchase(purchaseId, suffix?): determinístico, derivado
//    del purchase_id. Garantiza idempotencia si un webhook reprocesa
//    el mismo evento (Meta deduplica por event_id). Suffix opcional
//    diferencia Purchase de CompleteRegistration sobre la misma
//    purchase (mismo ID base sin suffix colisionaría en Meta dedup).
// =====================================================================

import { createHash, randomUUID } from "crypto";

export function generateEventId(): string {
  return randomUUID();
}

export function eventIdFromPurchase(
  purchaseId: string,
  suffix?: string,
): string {
  const input = suffix ? `${purchaseId}::${suffix}` : purchaseId;
  // SHA-256 truncado a 32 hex chars (128 bits) — suficiente para no
  // colisionar en práctica, más legible en logs que un hash completo.
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}
