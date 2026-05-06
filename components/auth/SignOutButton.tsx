"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";

// Botón discreto para cerrar sesión. Después del signOut limpia el
// router cache (refresh) y empuja a /login. signOut() limpia las
// cookies de Supabase; al re-renderizar /login server-side, getUser()
// devolverá null y la página mostrará el LoginScreen.

export function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-raleway text-[12px] tracking-[0.2em] uppercase text-marfil/55 hover:text-marfil/85 transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
