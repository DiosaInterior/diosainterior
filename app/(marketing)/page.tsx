import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Landing } from "@/components/landing/Landing";
import { getUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Diosa Interior — Descubre los colores que te pertenecen",
  description:
    "La primera guía de colorimetría calibrada para la diversidad de la piel. Tu paleta exacta, calibrada con ciencia.",
  openGraph: {
    title: "Diosa Interior",
    description:
      "Descubre los colores que te pertenecen. La primera guía de colorimetría calibrada para la diversidad de la piel.",
    url: "https://diosainterior.app",
    type: "website",
  },
};

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

  // Caso 3: Anónima sin code → landing comercial editorial (G.3).
  return <Landing />;
}
