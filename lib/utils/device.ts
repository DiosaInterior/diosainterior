// Detección sincrónica de plataforma para UI device-aware.
// SSR-safe: devuelve "desktop" cuando window no existe.
// El UA se chequea en lowercase para evitar inconsistencias entre browsers.

export type Device = "ios" | "android" | "desktop";

export function detectDevice(): Device {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}
