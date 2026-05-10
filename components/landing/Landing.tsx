import { CierreIdentitario } from "./CierreIdentitario";
import { ComoFunciona } from "./ComoFunciona";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { LoQueRecibes } from "./LoQueRecibes";
import { PorQueEsDiferente } from "./PorQueEsDiferente";

// Landing comercial G.3 — composición de 6 secciones editoriales.
// Vibe: editorial cinematográfico premium (Vogue / Sage / Garoa / Bioflora).
// Mobile-first: stack vertical. Desktop ≥lg: layouts asimétricos.
export function Landing() {
  return (
    <main>
      <Hero />
      <ComoFunciona />
      <PorQueEsDiferente />
      <LoQueRecibes />
      <CierreIdentitario />
      <Footer />
    </main>
  );
}
