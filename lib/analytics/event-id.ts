// =====================================================================
// Diosa Interior — Event IDs (client-safe, Web Crypto API)
// =====================================================================
// Helper de generación de event_id usable tanto en cliente como en
// server. Usa Web Crypto API (globalThis.crypto) — disponible en
// Node 19+ y en todos los browsers modernos (Safari 15.4+, Chrome
// 92+, Firefox 95+).
//
// G.7.1 — split del archivo original. El módulo G.7 importaba
// `randomUUID` desde "crypto" de Node, lo cual bundlea polyfills
// rotos en el cliente: en browser `randomUUID` quedaba undefined y
// `generateEventId()` tiraba TypeError. Eso bloqueaba 100% el flow
// de checkout (useCheckout llamaba esta función antes del fetch a
// /api/checkout/create-session → la excepción dejaba setLoading en
// true para siempre y nunca disparaba el fetch).
//
// El hash determinístico (eventIdFromPurchase) se movió a
// `event-id-server.ts` para mantener separación clara: este archivo
// es seguro de importar en cualquier contexto. NO importar
// node:crypto acá.
// =====================================================================

export function generateEventId(): string {
  return globalThis.crypto.randomUUID();
}
