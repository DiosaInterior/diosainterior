import type { Palette } from "@/lib/validation/guide-schema";

import { PaletaSwatch } from "./PaletaSwatch";

// G.6.B — antes recibía `colors: PaletteColor[]` (6 fijos). Ahora recibe
// `palette: Palette` completo y muestra hero (6 swatches grandes) +
// extended (8-15 swatches más chicos). El copy hardcoded "Los seis
// colores que te pertenecen" se retiró: la paleta puede tener más de 6
// tras la sección hero.
export function PaletaGrid({ palette }: { palette: Palette }) {
  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Tu paleta
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Los colores que te pertenecen
      </h2>

      {/* Hero — 6 swatches grandes, los más representativos */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
        {palette.hero.map((c) => (
          <PaletaSwatch key={c.hex} color={c} />
        ))}
      </div>

      {/* Extended — pool ampliado, swatches más chicos para diferenciar
          jerarquía. Solo render si hay extended (defensivo). */}
      {palette.extended.length > 0 && (
        <div className="mt-20">
          <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
            Paleta extendida
          </p>
          <h3 className="mt-2 font-cormorant italic text-2xl md:text-3xl text-marfil leading-tight">
            Tus matices complementarios
          </h3>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {palette.extended.map((c) => (
              <figure key={c.hex}>
                <div
                  className="w-full aspect-square rounded-sm border border-marfil/15"
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.nombre}
                />
                <figcaption className="mt-2">
                  <p className="font-cormorant italic text-sm md:text-base text-marfil leading-tight">
                    {c.nombre}
                  </p>
                  <p className="font-dm-mono text-[10px] text-marfil-suave/70 uppercase tracking-widest tabular-nums">
                    {c.hex}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
