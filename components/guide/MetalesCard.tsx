import type { Jewelry } from "@/lib/validation/guide-schema";

const METAL_DISPLAY: Record<Jewelry["type"], { label: string; hex: string }> = {
  gold_yellow: { label: "Oro amarillo", hex: "#D4A02A" },
  gold_warm: { label: "Oro cálido", hex: "#C9962F" },
  silver: { label: "Plata", hex: "#B8B8B8" },
  platinum: { label: "Platino", hex: "#E5E5E0" },
  bronze: { label: "Bronce", hex: "#8C5524" },
  copper: { label: "Cobre", hex: "#A0522D" },
  rose_gold: { label: "Oro rosa", hex: "#B86E5C" },
  gold_antique: { label: "Oro antiguo", hex: "#B5A04A" },
  silver_oxidized: { label: "Plata oxidada", hex: "#6B6B6B" },
};

export function MetalesCard({ jewelry }: { jewelry: Jewelry }) {
  const metal = METAL_DISPLAY[jewelry.type];

  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Joyería
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Tu metal
      </h2>

      <div className="mt-12 flex flex-col md:flex-row gap-6 md:gap-10 items-start">
        <div
          className="w-24 h-24 md:w-28 md:h-28 border border-marfil/15 rounded-sm shrink-0"
          style={{ backgroundColor: metal.hex }}
          aria-label={metal.label}
        />
        <div>
          <p className="font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
            {metal.label}
          </p>
          <p className="mt-4 font-cormorant italic text-base md:text-lg text-marfil-suave leading-relaxed max-w-prose">
            {jewelry.rationale}
          </p>
        </div>
      </div>
    </section>
  );
}
