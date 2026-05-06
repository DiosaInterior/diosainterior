// Server component de /analizando — landing post-pago.
//
// Stub provisional. Stripe redirige acá tras un Checkout exitoso con
// `?session_id={CHECKOUT_SESSION_ID}`. Validamos que el session_id
// pertenece a la usuaria autenticada (defensiva contra URL guessing)
// y mostramos copy editorial. La lógica real de "encolar análisis IA"
// vive en el webhook handler (E.4) y el job Inngest (Bloque F).

import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/db/server";

export const metadata = {
  title: "Tu análisis está en camino — Diosa Interior",
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
        <Logo size={90} className="mx-auto mb-8" />

        <p className="font-dm-mono uppercase text-[10px] tracking-[0.4em] text-terra-diosa/85 mb-3">
          Pago recibido · Análisis en proceso
        </p>

        <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.05] tracking-tight">
          Tu análisis está
          <br />
          en camino
        </h1>

        <p className="font-cormorant italic text-marfil-suave/65 text-[18px] leading-[1.4] mt-6">
          Te avisaremos por email cuando tu guía personalizada esté lista.
        </p>

        <p className="font-raleway text-[12px] text-marfil/40 mt-12 leading-[1.5] max-w-[320px] mx-auto">
          (Esta página es provisional. El flujo de análisis con IA llega
          en el siguiente bloque.)
        </p>

        <div className="mt-16">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
