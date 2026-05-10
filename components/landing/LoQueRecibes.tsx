import { RevealOnScroll } from "./_RevealOnScroll";

const RECEIVES = [
  {
    title: "Tus colores",
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

export function LoQueRecibes() {
  return (
    <section className="dark-radial py-24 lg:py-32 px-6 sm:px-10 lg:px-16">
      <div className="max-w-[1200px] mx-auto">
        <RevealOnScroll>
          <p className="font-dm-mono uppercase tracking-widest text-xs text-terra-diosa text-center mb-16">
            Lo que recibes
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {RECEIVES.map((card, i) => (
            <RevealOnScroll key={card.title} delay={(i % 3) * 80}>
              <article className="group h-full p-8 border border-terra-diosa/15 rounded-lg bg-vino-medio/30 hover:border-terra-diosa/35 hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="font-cormorant italic text-marfil text-xl lg:text-2xl leading-tight">
                  {card.title}
                </h3>
                <div className="mt-3 h-px w-6 bg-terra-diosa group-hover:w-12 transition-all duration-300" />
                <p className="font-raleway text-marfil-suave/70 text-sm lg:text-base leading-relaxed mt-4">
                  {card.desc}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
