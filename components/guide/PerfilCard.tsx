import type { Guide } from "@/lib/validation/guide-schema";

function toDisplay(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PerfilCard({ guide }: { guide: Guide }) {
  const { scientific, rationale } = guide;
  const seasonDisplay = toDisplay(scientific.season);
  const undertoneDisplay = scientific.undertone.replace(/_/g, " ");
  const hueDisplay = scientific.hue.replace(/_/g, " ");

  return (
    <section>
      <h1 className="font-cormorant italic font-light text-marfil text-5xl md:text-6xl leading-tight tracking-tight">
        {seasonDisplay}
      </h1>

      <p className="font-raleway text-sm text-marfil-suave uppercase tracking-wider mt-3">
        Fitzpatrick {scientific.fitzpatrick} · {undertoneDisplay} · {hueDisplay}
      </p>

      <div className="mt-8 h-px w-12 bg-marfil/10" />

      <p className="font-cormorant italic text-lg md:text-xl text-marfil leading-relaxed mt-8 max-w-prose">
        {rationale}
      </p>
    </section>
  );
}
