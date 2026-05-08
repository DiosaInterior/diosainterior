import type { Makeup, MakeupItem } from "@/lib/validation/guide-schema";

function MakeupRow({ item, eyebrow }: { item: MakeupItem; eyebrow: string }) {
  return (
    <div className="flex gap-5 items-start">
      <div
        className="w-16 h-16 border border-marfil/15 rounded-sm shrink-0"
        style={{ backgroundColor: item.hex }}
        aria-label={item.name}
      />
      <div>
        <p className="font-dm-mono text-[10px] uppercase tracking-widest text-marfil-suave/70">
          {eyebrow}
        </p>
        <p className="mt-1 font-cormorant italic text-2xl text-marfil leading-tight">
          {item.name}
        </p>
        <p className="mt-1 font-dm-mono text-xs text-marfil-suave uppercase tracking-widest tabular-nums">
          {item.hex}
        </p>
      </div>
    </div>
  );
}

export function MaquillajeCard({ makeup }: { makeup: Makeup }) {
  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Maquillaje
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Tu base cromática
      </h2>

      <div className="mt-12 flex flex-col gap-8">
        <MakeupRow item={makeup.lipstick} eyebrow="LABIAL" />
        {makeup.blush && <MakeupRow item={makeup.blush} eyebrow="RUBOR" />}
      </div>
    </section>
  );
}
