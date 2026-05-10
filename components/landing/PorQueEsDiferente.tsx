import Image from "next/image";

import { RevealOnScroll } from "./_RevealOnScroll";

export function PorQueEsDiferente() {
  return (
    <section className="relative py-24 lg:py-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
      {/* Background image + vino overlay */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/landing/comunidad-jungle.png"
          alt="Comunidad de mujeres de pieles diversas en un atardecer cinematográfico"
          fill
          sizes="100vw"
          quality={85}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-vino-profundo/85" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <RevealOnScroll>
          <p className="font-dm-mono uppercase tracking-widest text-xs text-terra-diosa">
            Por qué es diferente
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={150}>
          <h2 className="font-cormorant text-marfil text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-[1.1] mt-10">
            Por décadas, los sistemas de colorimetría se calibraron para{" "}
            <em className="italic">una sola arquitectura</em> de piel.
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
          <p className="font-raleway text-base sm:text-lg lg:text-xl text-marfil-suave leading-relaxed mt-10 max-w-2xl mx-auto">
            Diosa Interior nace para corregir ese vacío. Cada análisis está
            calibrado con la diversidad real de undertones, profundidades y
            matices que existen en la piel humana.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={450}>
          <p className="font-cormorant italic text-2xl sm:text-3xl lg:text-4xl text-terra-2 leading-relaxed mt-12">
            Tu paleta no es una aproximación. Es tuya.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
