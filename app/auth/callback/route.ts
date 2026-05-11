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

import { generateEventId } from "@/lib/analytics/event-id";
import { sendCapiEvent } from "@/lib/analytics/meta-capi";
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

  // G.7 — Meta CAPI 'Lead' fire-and-forget. Se dispara en CADA OAuth
  // exitoso (no solo primer signup) — Meta deduplica por user-side
  // matching de email. Si CAPI falla, sendCapiEvent loguea a Sentry y
  // no rompe el flow. Usamos generateEventId() (no determinístico)
  // porque cada login es un evento independiente para optimización.
  sendCapiEvent({
    eventName: "Lead",
    eventId: generateEventId(),
    userData: {
      email: data.user.email ?? undefined,
      client_ip_address:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
      client_user_agent: request.headers.get("user-agent") ?? undefined,
    },
    customData: { content_name: "signup_completed" },
    eventSourceUrl: `${origin}/auth/callback`,
  }).catch(() => {
    // sendCapiEvent ya loguea a Sentry internamente. Este catch es por
    // si rejecta antes de su propio try (defensive).
  });

  // Caso (1): next explícito y válido → respetarlo, EXCEPTO cuando es
  // exactamente "/upload" (el default que setea signInWithGoogle). Si
  // respetáramos siempre, el smart redirect nunca se activaría para el
  // flow normal de Google OAuth (que es el 99% del tráfico). Con esta
  // condición, links externos / magic links / password recovery con un
  // next explícito distinto de /upload siguen aterrizando donde piden.
  if (next && next !== "/upload") {
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
