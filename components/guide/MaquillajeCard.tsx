import type {
  Makeup,
  MakeupCategory,
  MakeupCategoryId,
} from "@/lib/validation/guide-schema";

// G.6.B — antes mostraba 2 zonas (lipstick + blush opcional). Ahora son
// 5 categorías fijas: lipstick (5), blush (3), eyeshadow (6), eyeliner
// (3), foundation (3). Schema ya enforza presencia única + count, así
// que el orden de render lo controlamos acá vía CATEGORY_ORDER en lugar
// de confiar en el orden que mande la IA.

const CATEGORY_ORDER: ReadonlyArray<MakeupCategoryId> = [
  "lipstick",
  "blush",
  "eyeshadow",
  "eyeliner",
  "foundation",
];

const CATEGORY_EYEBROW: Readonly<Record<MakeupCategoryId, string>> = {
  lipstick: "Labios",
  blush: "Rubor",
  eyeshadow: "Sombras",
  eyeliner: "Delineador",
  foundation: "Base",
};

function CategorySection({ cat }: { cat: MakeupCategory }) {
  return (
    <div className="border-t border-marfil/10 pt-8">
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        {CATEGORY_EYEBROW[cat.category]}
      </p>
      <h3 className="mt-2 font-cormorant italic text-2xl md:text-3xl text-marfil leading-tight">
        {cat.label}
      </h3>
      <p className="mt-3 font-cormorant italic text-base md:text-lg text-marfil-suave leading-relaxed max-w-prose">
        {cat.rationale}
      </p>
      <div className="mt-6 flex flex-wrap gap-5">
        {cat.colors.map((color) => (
          <figure
            key={color.hex}
            className="flex flex-col items-start"
            title={color.tip ?? color.nombre}
          >
            <div
              className="w-14 h-14 border border-marfil/15 rounded-sm"
              style={{ backgroundColor: color.hex }}
              aria-label={color.nombre}
            />
            <figcaption className="mt-2 max-w-[110px]">
              <p className="font-cormorant italic text-sm text-marfil leading-tight">
                {color.nombre}
              </p>
              <p className="font-dm-mono text-[10px] text-marfil-suave/70 uppercase tracking-widest tabular-nums">
                {color.hex}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function MaquillajeCard({ makeup }: { makeup: Makeup }) {
  // Reordenamos las categorías al orden canónico (lipstick → blush →
  // eyeshadow → eyeliner → foundation) independiente del orden que mande
  // la IA. Esto da render consistente.
  const ordered = CATEGORY_ORDER.map((id) =>
    makeup.categories.find((c) => c.category === id),
  ).filter((c): c is MakeupCategory => c !== undefined);

  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Maquillaje
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Tu base cromática
      </h2>

      <p className="mt-8 font-cormorant italic text-lg md:text-xl text-marfil leading-relaxed max-w-prose">
        {makeup.narrative}
      </p>

      <div className="mt-12 flex flex-col gap-12">
        {ordered.map((cat) => (
          <CategorySection key={cat.category} cat={cat} />
        ))}
      </div>
    </section>
  );
}
