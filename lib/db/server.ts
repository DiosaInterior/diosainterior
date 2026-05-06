// =====================================================================
// Supabase client para SERVER (server components, route handlers, jobs)
// =====================================================================
// Uso: server components, route handlers en /app/api/*, server actions,
// jobs Inngest. Sincroniza la sesión vía cookies de Next.
//
// NO importar desde client components — usa `lib/db/client.ts`.
//
// Service role: para casos que requieran bypassar RLS (webhook Stripe,
// jobs background) se añadirá un cliente separado en Bloque C usando
// SUPABASE_SERVICE_ROLE_KEY.
// =====================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll desde un Server Component no puede mutar cookies
            // — se ignora y el middleware refrescará la sesión.
          }
        },
      },
    },
  );
}
