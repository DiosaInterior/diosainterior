// =====================================================================
// Helpers de auth para SERVER (server components, route handlers, server actions)
// =====================================================================
// Uso: cualquier código que corra en el servidor de Next y necesite saber
// quién es la usuaria autenticada. Lee la sesión vía cookies usando el
// cliente Supabase server-side de `lib/db/server.ts`.
//
// `getUser()` devuelve el user o null (uso defensivo / pantallas públicas
// que cambian de comportamiento si hay sesión).
//
// `requireUser()` garantiza un user — si no hay sesión, dispara
// `redirect("/login")` de Next, que lanza una excepción especial para
// interrumpir el render. La página /login se crea en C.6.
//
// IMPORTANTE: usar `auth.getUser()` (no `auth.getSession()`) — getUser
// re-valida el JWT contra el auth server de Supabase. getSession solo
// lee la cookie y es vulnerable a tokens manipulados.
//
// NO importar desde client components — `next/headers` solo existe en server.
// =====================================================================

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/db/server";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
