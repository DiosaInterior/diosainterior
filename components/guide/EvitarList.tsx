export function EvitarList({ avoid }: { avoid: string[] }) {
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
          <li key={item} className="flex gap-3 items-start">
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-terra-diosa/60 mt-2 shrink-0"
            />
            <span className="font-raleway text-base text-marfil-suave leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
