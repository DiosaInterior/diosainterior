import Image from "next/image";
import Link from "next/link";

import { RevealOnScroll } from "./_RevealOnScroll";

const CTA_CLASSES =
  "inline-block bg-terra-diosa text-marfil font-dm-mono uppercase tracking-widest text-sm px-10 py-5 hover:bg-terra-2 hover:scale-[1.02] transition-all duration-200";

export function CierreIdentitario() {
  return (
    <section className="dark-radial">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[700px]">
        {/* Imagen — order-1 (arriba mobile, izquierda desktop) */}
        <div className="order-1 relative h-[60vh] lg:h-auto">
          <Image
            src="/landing/escultura-mexico.png"
            alt="Instalación monumental de la flor de ocho pétalos de Diosa Interior en una plaza de Ciudad de México, cada pétalo en un color de paleta"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={85}
            className="object-cover"
          />
        </div>

        {/* Texto — order-2 (abajo mobile, derecha desktop) */}
        <div className="order-2 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-20 lg:py-16">
          <RevealOnScroll>
            <p className="font-dm-mono uppercase tracking-widest text-xs text-terra-diosa">
              Tu paleta
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={150}>
            <h2 className="font-cormorant italic font-light text-marfil text-4xl sm:text-5xl lg:text-7xl leading-[1.0] tracking-tight mt-8">
              Tu paleta te está esperando.
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={300}>
            <p className="font-raleway text-base sm:text-lg text-marfil-suave/80 leading-relaxed mt-10 max-w-md">
              Colores. Tu base, tu metal, tu maquillaje. Calibrados con la
              ciencia de tu piel.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={450}>
            <Link href="/login" className={`mt-12 ${CTA_CLASSES}`}>
              Descubrirla →
            </Link>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
