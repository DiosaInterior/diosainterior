import Image from "next/image";

import { RevealOnScroll } from "./_RevealOnScroll";

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
    desc: "Más de un siglo de ciencia. En 5 minutos.",
  },
];

export function ComoFunciona() {
  return (
    <section className="dark-radial py-24 lg:py-32 px-6 sm:px-10 lg:px-16">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-12">
        {STEPS.map((step, i) => (
          <RevealOnScroll key={step.n} delay={i * 120}>
            <div className="border-t border-terra-diosa/20 pt-8">
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="opacity-55 mb-4 lg:mb-6 w-8 h-8 lg:w-10 lg:h-10"
              />
              <p className="font-dm-mono font-light text-terra-diosa text-4xl lg:text-6xl mb-6 tracking-tight">
                {step.n}
              </p>
              <h3 className="font-cormorant italic text-marfil text-2xl lg:text-3xl leading-tight mb-4 max-w-sm">
                {step.title}
              </h3>
              <p className="font-raleway text-marfil-suave/70 text-base leading-relaxed max-w-sm">
                {step.desc}
              </p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
