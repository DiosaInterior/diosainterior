import { RevealOnScroll } from "./_RevealOnScroll";

const TESTIMONIOS = [
  {
    quote:
      "Llevaba años usando colores que pensé que me favorecían. La paleta de Diosa Interior cambió completamente cómo me veo en el espejo.",
    name: "Carla Morales",
  },
  {
    quote:
      "Por fin entendí por qué algunos colores me apagan y otros me iluminan. No es magia — es la temperatura de mi piel. La ciencia detrás me convenció.",
    name: "Susana Romero",
  },
  {
    quote:
      "Lo consulto antes de comprar ropa, antes de elegir el labial. Tener mi paleta guardada en el celular es como llevar una asesora de imagen siempre conmigo.",
    name: "Ingrid Falomir",
  },
];

export function Testimonios() {
  return (
    <section className="dark-radial py-24 lg:py-32 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <p className="font-dm-mono text-xs tracking-[0.4em] uppercase text-terra-diosa text-center mb-16">
            Lo que dicen
          </p>
        </RevealOnScroll>

        <div
          className="
            flex lg:grid lg:grid-cols-3 gap-6 lg:gap-10
            overflow-x-auto lg:overflow-visible
            snap-x snap-mandatory lg:snap-none
            -mx-6 sm:-mx-8 lg:mx-0 px-6 sm:px-8 lg:px-0
            scrollbar-hide
          "
        >
          {TESTIMONIOS.map((t, i) => (
            <RevealOnScroll key={t.name} delay={i * 120}>
              <article
                className="
                  snap-center lg:snap-align-none
                  shrink-0 lg:shrink
                  w-[85vw] sm:w-[70vw] lg:w-auto
                  h-full p-8 lg:p-10
                  border border-terra-diosa/15 rounded-lg
                  bg-vino-medio/30
                  flex flex-col justify-between gap-8
                "
              >
                <p className="font-cormorant italic text-marfil text-xl lg:text-2xl leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="font-dm-mono text-xs tracking-[0.3em] uppercase text-terra-2">
                  {t.name}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
