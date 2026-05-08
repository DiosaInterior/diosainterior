// Callback OAuth — recibe el redirect de Supabase con `?code=...` tras
// que la usuaria autoriza en Google. Intercambia el code por una sesión
// (cookies HttpOnly) y redirige a /upload. Si falta el code o falla el
// exchange, devuelve a /login con `?error=auth_failed`.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Sanitizar next: solo paths internos. Si viene malformado o ausente,
  // default a /upload (entry point post-pago/post-login canónico).
  const nextRaw = searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/upload";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
