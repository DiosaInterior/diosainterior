// =====================================================================
// Helpers de auth para componentes CLIENT (browser)
// =====================================================================
// Uso: en componentes con `"use client"` que disparan flujos de sesión
// (botón "Entrar con Google", botón "Cerrar sesión", etc.).
//
// `signInWithGoogle()` redirige a la pantalla de consentimiento de Google
// y al volver aterriza en `/auth/callback` (route handler creado en C.6),
// que intercambia el `code` por una sesión y setea cookies HttpOnly.
//
// `signOut()` limpia las cookies de Supabase. El caller decide qué hacer
// después (router.refresh(), router.push("/"), etc.).
//
// Ambas devuelven el shape `{ data, error }` de @supabase/supabase-js sin
// transformar — el caller decide cómo presentar errores en UI.
//
// NO importar desde server components — `window` solo existe en browser.
// =====================================================================

import { createClient } from "@/lib/db/client";

export async function signInWithGoogle() {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
