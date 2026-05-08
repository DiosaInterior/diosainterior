import type { Occasion, PaletteColor } from "@/lib/validation/guide-schema";

const OCCASION_LABEL: Record<Occasion, string> = {
  diario: "Día a día",
  trabajo: "Trabajo",
  noche: "Noche",
  formal: "Formal",
  casual: "Casual",
  evento: "Evento",
};

const OCCASION_ORDER: Occasion[] = [
  "diario",
  "trabajo",
  "noche",
  "formal",
  "casual",
  "evento",
];

export function OcasionesGrid({ colors }: { colors: PaletteColor[] }) {
  const buckets = new Map<Occasion, PaletteColor[]>();
  for (const color of colors) {
    for (const occ of color.occasions ?? []) {
      const bucket = buckets.get(occ) ?? [];
      bucket.push(color);
      buckets.set(occ, bucket);
    }
  }

  const rows = OCCASION_ORDER.filter((occ) => (buckets.get(occ)?.length ?? 0) > 0);

  if (rows.length === 0) return null;

  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Para cada momento
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Cuándo usar cada color
      </h2>

      <div className="mt-12">
        {rows.map((occ) => {
          const bucket = buckets.get(occ) ?? [];
          return (
            <div
              key={occ}
              className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] gap-6 items-center py-5 border-b border-marfil/10 last:border-b-0"
            >
              <p className="font-cormorant italic text-xl md:text-2xl text-marfil">
                {OCCASION_LABEL[occ]}
              </p>
              <div className="flex flex-wrap gap-3">
                {bucket.map((color) => (
                  <span
                    key={color.hex}
                    title={color.nombre}
                    style={{ backgroundColor: color.hex }}
                    className="w-8 h-8 border border-marfil/15 rounded-sm"
                    aria-label={color.nombre}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
