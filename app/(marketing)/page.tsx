import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { getUser } from "@/lib/auth/server";

type SearchParams = Promise<{
  code?: string;
  next?: string;
  error?: string;
  error_description?: string;
}>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Caso 1: Llegó ?code= a la raíz (Supabase Site URL fallback por
  // redirectTo no whitelisteado, o link directo). Reenviamos al callback
  // handler que sabe procesar el exchange — evita perder la sesión.
  // Si vino ?next= junto con el code lo preservamos con la misma
  // sanitización que client.ts y callback/route.ts (path interno, no //).
  if (params.code) {
    const nextRaw = params.next;
    const next =
      nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
        ? nextRaw
        : "/upload";
    const cbParams = new URLSearchParams({
      code: params.code,
      next,
    });
    redirect(`/auth/callback?${cbParams.toString()}`);
  }

  // Caso 2: Usuaria con sesión activa que aterrizó en raíz (bookmark,
  // navegación manual) → directo a /upload, su entry point canónico.
  const user = await getUser();
  if (user) {
    redirect("/upload");
  }

  // Caso 3: Anónima sin code → landing actual (placeholder G.3).
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
