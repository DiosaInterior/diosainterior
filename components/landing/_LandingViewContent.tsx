"use client";

// Disparador de evento Meta Pixel 'ViewContent' al cargar la landing.
// Componente sin UI (return null) — solo side-effect en mount. Vive
// en client para poder usar useEffect; el Landing wrapper es server.

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/meta-pixel";

export function LandingViewContent() {
  useEffect(() => {
    trackEvent("ViewContent", { content_name: "landing" });
  }, []);
  return null;
}
