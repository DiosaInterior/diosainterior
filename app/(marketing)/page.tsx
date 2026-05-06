import { Logo } from "@/components/brand/Logo";

export default function Home() {
  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center justify-center px-8 py-16">
      <Logo size={120} className="mb-12 opacity-90" />

      <p className="font-raleway text-[14px] tracking-[0.4em] uppercase text-terra-diosa/85 mb-8">
        En construcción
      </p>

      <h1 className="font-cormorant italic font-light text-marfil text-5xl sm:text-6xl text-center max-w-2xl leading-[0.95] tracking-tight">
        Diosa Interior
      </h1>

      <p className="font-cormorant italic text-marfil-suave/65 text-xl sm:text-2xl text-center max-w-xl mt-6 leading-relaxed">
        La primera guía de colorimetría diseñada específicamente para piel latina.
      </p>

      <p className="font-dm-mono text-terra-diosa/55 text-sm tracking-[0.35em] uppercase mt-16">
        v2 · {new Date().getFullYear()}
      </p>
    </main>
  );
}
