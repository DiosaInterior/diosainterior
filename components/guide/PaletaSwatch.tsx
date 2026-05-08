import type { PaletteColor } from "@/lib/validation/guide-schema";

export function PaletaSwatch({ color }: { color: PaletteColor }) {
  return (
    <figure>
      <div
        className="w-full aspect-square rounded-sm border border-marfil/15 shadow-[inset_0_0_0_1px_rgba(253,240,232,0.04)]"
        style={{ backgroundColor: color.hex }}
        aria-label={color.nombre}
      />
      <figcaption className="mt-3">
        <p className="font-dm-mono text-xs text-marfil-suave uppercase tracking-widest tabular-nums">
          {color.hex}
        </p>
        <p className="mt-1 font-cormorant italic text-xl md:text-2xl text-marfil leading-tight">
          {color.nombre}
        </p>
        <p className="mt-2 font-raleway text-sm text-marfil-suave leading-relaxed line-clamp-3">
          {color.usage}
        </p>
      </figcaption>
    </figure>
  );
}
