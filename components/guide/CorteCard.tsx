import type { Haircut } from "@/lib/validation/guide-schema";

export function CorteCard({ haircut }: { haircut: Haircut }) {
  return (
    <section>
      <p className="font-dm-mono text-xs uppercase tracking-widest text-terra-diosa">
        Cabello
      </p>
      <h2 className="mt-2 font-cormorant italic text-3xl md:text-4xl text-marfil leading-tight">
        Tu corte y movimiento
      </h2>

      <div className="mt-12">
        <p className="font-cormorant italic text-xl md:text-2xl text-marfil leading-relaxed max-w-prose">
          {haircut.description}
        </p>
        <p className="mt-6 font-cormorant italic text-base md:text-lg text-marfil-suave leading-relaxed max-w-prose">
          {haircut.rationale}
        </p>
      </div>
    </section>
  );
}
