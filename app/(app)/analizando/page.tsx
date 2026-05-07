// Server component de /analizando — landing post-pago.
//
// Stripe redirige acá tras un Checkout exitoso con
// `?session_id={CHECKOUT_SESSION_ID}`. Validamos que el session_id
// pertenece a la usuaria autenticada (defensiva contra URL guessing).
// La lógica real de "encolar análisis IA" vive en el webhook handler
// (E.4) y el job Inngest (Bloque F).
//
// Voz §13 de la biblia: íntima-experta, declarativa, sin promesas
// vendedoras ni frases tipo coach motivacional. La usuaria queda con
// sesión vigente y puede cerrar la página — su guía la espera al
// volver. No hay email ni notificación push en esta fase.

import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/db/server";

export const metadata = {
  title: "Tu análisis está en proceso — Diosa Interior",
};

export default async function AnalizandoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireUser();
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/upload");
  }

  // La purchase row puede tardar un instante en tener el stripe_session_id
  // (lo seteamos en el route handler tras crear la session). Si no la
  // encontramos acá, redirect defensivo.
  const supabase = await createClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("stripe_session_id", session_id)
    .maybeSingle();

  if (!purchase) {
    redirect("/upload");
  }

  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-8 py-12 box-border mx-auto text-center">
        <Logo size={90} className="mx-auto mb-10" />

        <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.1] tracking-tight">
          Tu análisis está en proceso.
        </h1>

        <p className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.55] max-w-[340px] mx-auto">
          Estamos leyendo cada foto con la precisión que merece tu piel.
        </p>

        <p className="font-raleway text-[15px] text-marfil/85 mt-4 leading-[1.55] max-w-[340px] mx-auto">
          Puedes cerrar esta página y volver cuando quieras — tu guía
          estará aquí.
        </p>

        <Link
          href="/"
          className="mt-16 font-dm-mono uppercase text-[10px] tracking-[0.4em] text-marfil/55 hover:text-marfil/85 transition-colors"
        >
          VOLVER AL INICIO
        </Link>
      </div>
    </main>
  );
}
