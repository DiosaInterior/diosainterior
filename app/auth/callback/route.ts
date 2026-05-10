// Callback OAuth — recibe el redirect de Supabase con `?code=...` tras
// que la usuaria autoriza en Google. Intercambia el code por una sesión
// (cookies HttpOnly) y luego decide a dónde mandarla:
//
//   1. Si vino ?next= válido → respetarlo siempre (links externos,
//      password recovery, email links no se rompen).
//   2. Si ?next= falta o es inválido → smart redirect según estado:
//      a. Tiene guía completa → /mi-guia
//      b. Pagó pero el job aún no terminó → /analizando?session_id=X
//      c. Sin compra paid ni guía → /upload (default canónico).
//
// G.4.3 — la lógica de PR #23 sigue intacta para el caso (1); el smart
// redirect del caso (2) es additivo. Si las queries de DB rompen, log
// del error y fallback silencioso a /upload.

import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import { getLatestGuideForUser } from "@/lib/db/guides";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");

  // Sanitización: solo paths internos válidos. Si no, dejamos null y
  // que el smart redirect decida.
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Caso (1): next explícito y válido → siempre respetarlo.
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Caso (2): smart redirect según estado de la usuaria.
  const userId = data.user.id;

  try {
    const [guide, purchaseResult] = await Promise.all([
      getLatestGuideForUser(userId),
      supabase
        .from("purchases")
        .select("stripe_session_id")
        .eq("user_id", userId)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // 2a — guía completa: la usuaria vuelve a su producto final.
    if (guide) {
      return NextResponse.redirect(`${origin}/mi-guia`);
    }

    // 2b — pagó pero el job aún no terminó: a la pantalla de espera.
    // /analizando exige ?session_id= para validar ownership.
    if (purchaseResult.data?.stripe_session_id) {
      return NextResponse.redirect(
        `${origin}/analizando?session_id=${purchaseResult.data.stripe_session_id}`,
      );
    }

    // Visibilidad: si la query de purchases erró por motivo distinto
    // a "no encontrado" (ej. RLS rechazando), lo logueamos antes del
    // fallback a /upload.
    if (purchaseResult.error) {
      console.error("[G.4.3] purchase query error", {
        userId,
        error: purchaseResult.error.message,
      });
    }

    // 2c — usuaria nueva o sin compra paid: entry point canónico.
    return NextResponse.redirect(`${origin}/upload`);
  } catch (err) {
    // Error inesperado (timeout, throw de la lib, etc): fallback seguro.
    console.error("[G.4.3] smart redirect query failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(`${origin}/upload`);
  }
}
