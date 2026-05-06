// =====================================================================
// Supabase admin client — service role, bypasea RLS
// =====================================================================
// `import 'server-only'` arriba refuerza que este módulo NUNCA viaja al
// bundle del cliente. La SERVICE_ROLE key tiene poder absoluto sobre
// la base; si se filtra al browser, cualquiera puede leer/escribir
// todas las tablas saltándose RLS.
//
// Uso correcto:
//  - Webhook handlers (que NO tienen sesión cookie de la usuaria).
//  - Jobs background (Inngest) que corren fuera del contexto de auth.
//  - Mutations server-side donde necesitamos cross-user access.
//
// Uso INCORRECTO:
//  - Server components / route handlers normales — usar createClient()
//    de lib/db/server.ts (cookie-based, respeta RLS).
//
// Lazy singleton: la instancia se cachea para llamadas siguientes.
// El env se valida a CALL time (no module-load), igual que getStripe().
// =====================================================================

import "server-only";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "./database.types";

let adminInstance: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL env var. Required for admin client.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY env var. Add it to .env.local from Supabase dashboard → Settings → API → service_role key.",
    );
  }

  if (!adminInstance) {
    adminInstance = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminInstance;
}
