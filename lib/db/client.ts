// =====================================================================
// Supabase client para componentes CLIENT (browser)
// =====================================================================
// Uso: en componentes con `"use client"` que necesiten leer/escribir
// datos del usuario autenticado. La sesión se lee de las cookies que
// gestiona @supabase/ssr automáticamente.
//
// NO importar desde server components ni route handlers — usar
// `lib/db/server.ts` en su lugar.
// =====================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
