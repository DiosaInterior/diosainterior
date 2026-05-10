import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

import { RevealOnScroll } from "./_RevealOnScroll";

const CTA_CLASSES =
  "inline-block bg-terra-diosa text-marfil font-dm-mono uppercase tracking-widest text-sm px-10 py-5 hover:bg-terra-2 hover:scale-[1.02] transition-all duration-200";

export function Hero() {
  return (
    <section className="dark-radial">
      <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] lg:min-h-dvh">
        {/* Texto — order-2 mobile, order-1 desktop */}
        <div className="order-2 lg:order-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-20 lg:py-16">
          <RevealOnScroll>
            <Logo size={64} className="mb-12" />
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <p className="font-raleway text-xs uppercase tracking-[0.4em] text-terra-diosa mb-8">
              Diosa Interior
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <h1 className="font-cormorant font-light text-marfil text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] leading-[0.95] tracking-tight">
              Descubre los <em className="italic">colores</em> que te{" "}
              <em className="italic">pertenecen</em>.
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={350}>
            <p className="font-raleway text-base sm:text-lg text-marfil-suave/80 mt-10 leading-relaxed max-w-md">
              La primera guía de colorimetría calibrada para la diversidad de
              la piel.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={450}>
            <p className="font-cormorant italic text-base sm:text-lg text-terra-suave mt-6 leading-relaxed max-w-md">
              Tu paleta, tu base, tu metal, tu maquillaje — calibrados con
              ciencia.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={600}>
            <Link href="/login" className={`mt-12 ${CTA_CLASSES}`}>
              Descubrir mi paleta →
            </Link>
          </RevealOnScroll>
        </div>

        {/* Imagen — order-1 mobile (arriba), order-2 desktop (derecha) */}
        <div className="order-1 lg:order-2 relative h-[70vh] lg:h-auto">
          <Image
            src="/landing/hero-paleta-diversa.png"
            alt="Mujeres de espaldas con globos de colores tierra reflejándose en el agua de Hierve el Agua. Representa la diversidad de pieles que Diosa Interior calibra."
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            quality={85}
            priority
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
