// CTA secundario para captura de follow en Instagram. Aparece después
// de CierreIdentitario para visitantes que llegaron de Meta Ads y no
// están listas para comprar en el primer touchpoint — el follow en
// Instagram permite nurturing orgánico.
//
// Estilo: outline pill, no compite con el CTA principal naranja sólido
// del Hero/Cierre. Voz editorial Cormorant italic + handle DM Mono.

import { RevealOnScroll } from "./_RevealOnScroll";

const INSTAGRAM_URL = "https://instagram.com/diosainterior";

export function InstagramCTA() {
  return (
    <section className="dark-radial py-20 lg:py-24 px-6 sm:px-8 lg:px-12 border-t border-marfil/8">
      <div className="max-w-2xl mx-auto text-center">
        <RevealOnScroll>
          <p className="font-cormorant italic text-marfil-suave/85 text-xl sm:text-2xl lg:text-3xl leading-relaxed mb-8">
            ¿No es el momento? Quedate cerca.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={150}>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 border border-terra-diosa/40 rounded-full hover:bg-vino-medio/40 hover:border-terra-diosa/70 transition-all duration-300 group min-h-[44px]"
            aria-label="Seguir a Diosa Interior en Instagram (abre en nueva pestaña)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-terra-2 group-hover:text-terra-diosa transition-colors"
              aria-hidden="true"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span className="font-dm-mono text-marfil text-xs sm:text-sm tracking-[0.3em] uppercase">
              @diosainterior
            </span>
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}
