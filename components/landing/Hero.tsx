import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

import { RevealOnScroll } from "./_RevealOnScroll";

const CTA_CLASSES =
  "inline-block bg-terra-diosa text-marfil font-dm-mono uppercase tracking-widest text-sm px-10 py-5 hover:bg-terra-2 hover:scale-[1.02] transition-all duration-200";

const HERO_IMAGE = "/landing/hero-paleta-diversa.png";
const HERO_ALT =
  "Mujeres de espaldas con globos de colores tierra reflejándose en el agua de Hierve el Agua. Representa la diversidad de pieles que Diosa Interior calibra.";

export function Hero() {
  return (
    <section className="dark-radial">
      {/* MOBILE (<lg): full-bleed image, text overlay, CTA above-the-fold */}
      <div className="lg:hidden relative min-h-dvh overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt={HERO_ALT}
          fill
          sizes="100vw"
          quality={85}
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-vino-profundo/85 via-vino-profundo/30 to-vino-profundo/70" />

        <div className="relative z-10 min-h-dvh flex flex-col justify-between px-6 py-12">
          <div>
            <RevealOnScroll>
              <div className="flex justify-center mt-8">
                <Logo size={56} className="opacity-90" />
              </div>
            </RevealOnScroll>

            <RevealOnScroll>
              <p className="font-raleway text-xs uppercase tracking-[0.4em] text-terra-diosa mt-6 text-center">
                Diosa Interior
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={150}>
              <h1 className="font-cormorant font-light text-marfil text-5xl sm:text-6xl leading-[0.95] tracking-tight mt-8 text-center">
                Descubre los <em className="italic">colores</em> que te{" "}
                <em className="italic">pertenecen</em>.
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <p className="font-raleway text-base sm:text-lg font-medium text-marfil-suave/90 mt-6 leading-relaxed max-w-prose mx-auto text-center">
                La primera guía de colorimetría calibrada para la diversidad de
                la piel.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={450}>
              <p className="font-cormorant italic font-medium text-base sm:text-lg text-terra-2 mt-6 text-center max-w-prose mx-auto">
                Tu paleta, tu base, tu metal, tu maquillaje — calibrados con
                ciencia.
              </p>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={600} className="mb-32 flex flex-col items-center gap-4">
            <Link href="/login" className={CTA_CLASSES}>
              Descubrir mi paleta →
            </Link>
            <p className="font-dm-mono text-[11px] tracking-[0.3em] uppercase text-marfil-suave/60">
              En menos de 5 minutos
            </p>
          </RevealOnScroll>
        </div>
      </div>

      {/* DESKTOP (≥lg): split 45/55, sin cambios respecto al diseño aprobado */}
      <div className="hidden lg:grid lg:grid-cols-[45fr_55fr] lg:min-h-dvh">
        <div className="flex flex-col justify-center px-16 py-16">
          <RevealOnScroll>
            <Logo size={64} className="mb-12" />
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <p className="font-raleway text-xs uppercase tracking-[0.4em] text-terra-diosa mb-8">
              Diosa Interior
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <h1 className="font-cormorant font-light text-marfil text-7xl xl:text-[80px] leading-[0.95] tracking-tight">
              Descubre los <em className="italic">colores</em> que te{" "}
              <em className="italic">pertenecen</em>.
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={350}>
            <p className="font-raleway text-lg text-marfil-suave/80 mt-10 leading-relaxed max-w-md">
              La primera guía de colorimetría calibrada para la diversidad de
              la piel.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={450}>
            <p className="font-cormorant italic text-lg text-terra-suave mt-6 leading-relaxed max-w-md">
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

        <div className="relative">
          <Image
            src={HERO_IMAGE}
            alt={HERO_ALT}
            fill
            sizes="55vw"
            quality={85}
            priority
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
