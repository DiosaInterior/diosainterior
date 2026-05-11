// =====================================================================
// Diosa Interior — Meta Pixel (client-side) wrapper
// =====================================================================
// G.7 — wrapper type-safe sobre window.fbq para disparar eventos del
// Pixel desde client components. El snippet base de fbq se carga en
// <MetaPixelScript /> renderizado dentro de <body> en layout.tsx.
//
// Defensive: si fbq todavía no cargó (SSR, network slow, ad-blocker),
// trackEvent es no-op. Analytics nunca debe romper el flujo.
//
// La deduplicación con CAPI server-side se hace pasando el mismo
// event_id (UUID) en ambos canales. Para eventos client-only
// (InitiateCheckout), eventId es generado por generateEventId() y
// descartado al disparar.
// =====================================================================

export type MetaPixelEventName =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "InitiateCheckout"
  | "Purchase"
  | "CompleteRegistration";

type FbqFn = (
  command: "track" | "init" | "trackCustom",
  eventNameOrId: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
  }
}

export function trackEvent(
  eventName: MetaPixelEventName,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (!fbq) return; // no-op si Pixel no cargó (ad-blocker, slow net)
  if (eventId) {
    fbq("track", eventName, params, { eventID: eventId });
  } else {
    fbq("track", eventName, params);
  }
}
