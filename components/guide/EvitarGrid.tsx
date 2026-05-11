import type { AvoidColor } from "@/lib/validation/guide-schema";

// G.6.B — reemplaza EvitarList. Antes era bullets con solo nombre; ahora
// muestra cada color como círculo 40×40 con nombre debajo. El `title`
// HTML nativo provee tooltip on hover en desktop. En mobile siempre se
// ve el nombre debajo del círculo.
export function EvitarGrid({ avoid }: { avoid: AvoidColor[] }) {
  if (avoid.length === 0) return null;

  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Colores a evitar
      </p>
      <h2 className="mt-2 font-cormorant italic text-2xl md:text-3xl text-marfil leading-tight">
        Lo que apaga tu luz
      </h2>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {avoid.map((item) => (
          <figure
            key={item.hex}
            className="flex flex-col items-center text-center"
            title={item.nombre}
          >
            <span
              aria-label={item.nombre}
              className="w-10 h-10 rounded-full border border-marfil/15"
              style={{ backgroundColor: item.hex }}
            />
            <figcaption className="mt-3 font-cormorant italic text-sm md:text-base text-marfil-suave/85 leading-tight">
              {item.nombre}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
