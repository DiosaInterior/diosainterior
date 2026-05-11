import type { AvoidColor } from "@/lib/validation/guide-schema";

// G.6.A — el prop `avoid` migró de `string[]` a `AvoidColor[]` por el
// cambio de schema. Este componente conserva su visual de bullets +
// nombres por compatibilidad: G.6.B introduce <EvitarGrid /> con
// swatches que sí aprovecha el `hex`. Mientras tanto ignoramos `hex`
// y renderizamos solo `nombre`.
export function EvitarList({ avoid }: { avoid: AvoidColor[] }) {
  if (avoid.length === 0) return null;

  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Lo que apaga tu luz
      </p>
      <h2 className="mt-2 font-cormorant italic text-2xl md:text-3xl text-marfil leading-tight">
        Para evitar
      </h2>

      <ul className="mt-8 flex flex-col gap-4">
        {avoid.map((item) => (
          <li key={item.hex} className="flex gap-3 items-start">
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-terra-diosa/60 mt-2 shrink-0"
            />
            <span className="font-raleway text-base text-marfil-suave leading-relaxed">
              {item.nombre}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
