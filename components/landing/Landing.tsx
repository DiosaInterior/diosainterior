import { CierreIdentitario } from "./CierreIdentitario";
import { ComoFunciona } from "./ComoFunciona";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { LoQueRecibes } from "./LoQueRecibes";
import { PorQueEsDiferente } from "./PorQueEsDiferente";
import { Testimonios } from "./Testimonios";

// Landing comercial G.3 — composición editorial.
// Vibe: editorial cinematográfico premium (Vogue / Sage / Garoa / Bioflora).
// Mobile-first: stack vertical. Desktop ≥lg: layouts asimétricos.
// Orden CRO 2025-2026: emoción (testimonios) → razón (FAQ) → CTA final.
export function Landing() {
  return (
    <main>
      <Hero />
      <ComoFunciona />
      <PorQueEsDiferente />
      <LoQueRecibes />
      <Testimonios />
      <FAQ />
      <CierreIdentitario />
      <Footer />
    </main>
  );
}
