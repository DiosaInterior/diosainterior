import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

const STEPS = [
  {
    n: "01",
    title: "Subes 4 fotos",
    desc: "Tu rostro, tu cabello, tu piel — en luz natural.",
  },
  {
    n: "02",
    title: "Análisis científico",
    desc: "Calibramos tu temperatura, tu undertone, tu profundidad.",
  },
  {
    n: "03",
    title: "Tu paleta",
    desc: "Seis colores que te pertenecen. Y la ciencia que los respalda.",
  },
];

const RECEIVES = [
  {
    title: "Tus seis colores",
    desc: "Con código exacto y nombre. Tu paleta personal.",
  },
  {
    title: "Cuándo usar cada uno",
    desc: "Para qué prendas, qué momentos, qué ocasiones.",
  },
  {
    title: "Qué colores evitar",
    desc: "Los matices que apagan tu piel — y por qué.",
  },
  {
    title: "Tu base cromática",
    desc: "La temperatura, undertone y profundidad de tu piel.",
  },
  {
    title: "Tu metal",
    desc: "Oro, plata, cobre — cuál es el tuyo y por qué.",
  },
  {
    title: "Tu maquillaje",
    desc: "Foundation, labial, sombras calibradas a tu paleta.",
  },
];

const CTA_CLASSES =
  "inline-block bg-terra-diosa text-marfil font-raleway uppercase tracking-widest text-sm px-8 py-4 hover:bg-terra-2 transition-colors";

export function Landing() {
  return (
    <main className="dark-radial min-h-dvh">
      {/* Hero */}
      <section className="px-6 py-20 md:py-28 max-w-[640px] mx-auto text-center">
        <Logo size={80} className="mx-auto mb-12" />

        <p className="font-raleway text-xs uppercase tracking-[0.4em] text-terra-diosa mb-8">
          Diosa Interior
        </p>

        <h1 className="font-cormorant italic font-light text-marfil text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight">
          Descubre los colores que te pertenecen.
        </h1>

        <p className="font-raleway text-base sm:text-lg text-marfil-suave mt-8 leading-relaxed max-w-[480px] mx-auto">
          La primera guía de colorimetría calibrada para la diversidad de la piel.
        </p>

        <p className="font-cormorant italic text-marfil-suave/75 text-base sm:text-lg mt-6 leading-relaxed max-w-[480px] mx-auto">
          Tu paleta, tu base, tu metal, tu maquillaje — calibrados con ciencia.
        </p>

        <Link href="/login" className={`mt-12 ${CTA_CLASSES}`}>
          Descubrir mi paleta →
        </Link>
      </section>

      {/* Cómo funciona */}
      <section className="px-6 py-20 md:py-28 max-w-[1080px] mx-auto">
        <p className="font-dm-mono uppercase tracking-widest text-xs text-terra-diosa text-center">
          Cómo funciona
        </p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-10 max-w-[900px] mx-auto">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center md:text-left">
              <p className="font-dm-mono text-terra-diosa text-base tracking-widest mb-4">
                {step.n}
              </p>
              <h3 className="font-cormorant italic text-marfil text-2xl md:text-3xl mb-3 leading-tight">
                {step.title}
              </h3>
              <p className="font-raleway text-marfil-suave leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Por qué es diferente */}
      <section className="px-6 py-20 md:py-28 max-w-[640px] mx-auto text-center">
        <p className="font-dm-mono uppercase tracking-widest text-xs text-terra-diosa">
          Por qué es diferente
        </p>
        <h2 className="font-cormorant italic text-marfil text-2xl md:text-3xl leading-snug mt-8 mb-8">
          Por décadas, los sistemas de colorimetría se calibraron para una sola
          arquitectura de piel.
        </h2>
        <p className="font-raleway text-marfil-suave text-base md:text-lg leading-relaxed mb-10">
          Diosa Interior nace para corregir ese vacío. Cada análisis está
          calibrado con la diversidad real de undertones, profundidades y
          matices que existen en la piel humana.
        </p>
        <p className="font-cormorant italic text-terra-diosa text-xl md:text-2xl leading-relaxed">
          Tu paleta no es una aproximación. Es tuya.
        </p>
      </section>

      {/* Lo que recibes */}
      <section className="px-6 py-20 md:py-28 max-w-[1080px] mx-auto">
        <p className="font-dm-mono uppercase tracking-widest text-xs text-terra-diosa text-center mb-16">
          Lo que recibes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 max-w-[800px] mx-auto">
          {RECEIVES.map((card) => (
            <div key={card.title}>
              <h3 className="font-cormorant italic text-marfil text-2xl md:text-3xl leading-tight mb-3">
                {card.title}
              </h3>
              <p className="font-raleway text-marfil-suave leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-24 md:py-32 max-w-[640px] mx-auto text-center">
        <h2 className="font-cormorant italic font-light text-marfil text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight mb-12">
          Tu paleta te está esperando.
        </h2>
        <Link href="/login" className={CTA_CLASSES}>
          Descubrirla →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-16 pt-8 max-w-[800px] mx-auto text-center">
        <p className="font-dm-mono text-xs sm:text-sm text-marfil-suave/65 leading-relaxed mb-10 max-w-prose mx-auto">
          Calibrado con sistemas científicos de colorimetría: Munsell, CIE Lab*,
          Fitzpatrick Scale y Princeton PERLA Project.
        </p>

        <p className="font-dm-mono text-xs text-marfil-suave/55 mb-6 flex flex-wrap justify-center gap-x-3 gap-y-2">
          <a
            href="https://instagram.com/diosainterior"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-marfil-suave transition-colors"
          >
            @diosainterior
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:hola@diosainterior.app"
            className="hover:text-marfil-suave transition-colors"
          >
            hola@diosainterior.app
          </a>
          <span aria-hidden="true">·</span>
          <Link href="/terminos" className="hover:text-marfil-suave transition-colors">
            Términos
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/privacidad"
            className="hover:text-marfil-suave transition-colors"
          >
            Privacidad
          </Link>
        </p>

        <p className="font-dm-mono text-xs text-marfil-suave/40">
          © 2026 Diosa Interior
        </p>
      </footer>
    </main>
  );
}
