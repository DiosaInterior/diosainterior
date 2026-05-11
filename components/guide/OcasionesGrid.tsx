import type { Occasions } from "@/lib/validation/guide-schema";

// G.6.B — antes recibía `colors: PaletteColor[]` y filtraba por
// `color.occasions`. Ahora recibe `occasions` como bloque independiente
// del Guide (6 entradas fijas con label + description + hex propios).
// Cada ocasión tiene su narrativa Cormorant y un row de swatches del
// pool extended de la paleta.
export function OcasionesGrid({ occasions }: { occasions: Occasions }) {
  if (occasions.length === 0) return null;

  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Para cada momento
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Cuándo usar cada color
      </h2>

      <div className="mt-12 flex flex-col gap-10">
        {occasions.map((occ) => (
          <article
            key={occ.id}
            className="border-b border-marfil/10 pb-8 last:border-b-0 last:pb-0"
          >
            <p className="font-cormorant italic text-2xl md:text-3xl text-marfil leading-tight">
              {occ.label}
            </p>
            <p className="mt-3 font-cormorant italic text-base md:text-lg text-marfil-suave leading-relaxed max-w-prose">
              {occ.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {occ.colors.map((hex) => (
                <span
                  key={hex}
                  title={hex}
                  style={{ backgroundColor: hex }}
                  className="w-10 h-10 border border-marfil/15 rounded-sm"
                  aria-label={hex}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
