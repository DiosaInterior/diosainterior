import Link from "next/link";

import { RevealOnScroll } from "./_RevealOnScroll";

export function Footer() {
  return (
    <footer className="dark-radial border-t border-marfil/10">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20 text-center">
        <RevealOnScroll>
          <p className="font-dm-mono text-xs text-marfil-suave/55 leading-relaxed max-w-prose mx-auto">
            Calibrado con sistemas científicos de colorimetría: Munsell, CIE
            Lab*, Fitzpatrick Scale y Princeton PERLA Project.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <p className="font-dm-mono text-xs text-marfil-suave/70 mt-12 flex flex-wrap justify-center gap-x-3 gap-y-2">
            <a
              href="https://instagram.com/diosainterior.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terra-diosa transition-colors"
            >
              @diosainterior.app
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="mailto:hola@diosainterior.app"
              className="hover:text-terra-diosa transition-colors"
            >
              hola@diosainterior.app
            </a>
            <span aria-hidden="true">·</span>
            <Link
              href="/terminos"
              className="hover:text-terra-diosa transition-colors"
            >
              Términos
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/privacidad"
              className="hover:text-terra-diosa transition-colors"
            >
              Privacidad
            </Link>
          </p>
        </RevealOnScroll>

        <p className="font-dm-mono text-xs text-marfil-suave/40 mt-8">
          © 2026 Diosa Interior
        </p>
      </div>
    </footer>
  );
}
