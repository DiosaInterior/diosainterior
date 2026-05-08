import type { PaletteColor } from "@/lib/validation/guide-schema";

import { PaletaSwatch } from "./PaletaSwatch";

export function PaletaGrid({ colors }: { colors: PaletteColor[] }) {
  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Tu paleta
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Los seis colores que te pertenecen
      </h2>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
        {colors.map((c) => (
          <PaletaSwatch key={c.hex} color={c} />
        ))}
      </div>
    </section>
  );
}
