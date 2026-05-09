// Server component de /analizando — landing post-pago.
//
// Stripe redirige acá tras un Checkout exitoso con
// `?session_id={CHECKOUT_SESSION_ID}`. Validamos que el session_id
// pertenece a la usuaria autenticada (defensiva contra URL guessing).
//
// Flow G.1:
//  1. Validar ownership de purchases via session_id
//  2. Lookup analysis_jobs por purchase_id (Inngest crea uno por purchase)
//  3. Si el job existe → render <AnalizandoClient> con polling real
//  4. Si todavía no existe (race con Inngest, ~1s window) → render
//     <WaitingForJob> con meta refresh cada 3s
//
// Voz §13 de la biblia: íntima-experta, declarativa, sin promesas
// vendedoras. La usuaria queda con sesión vigente y puede cerrar la
// página — su guía la espera al volver.

import Link from "next/link";
import { redirect } from "next/navigation";

import { AnalizandoClient } from "@/components/analizando/AnalizandoClient";
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

  const supabase = await createClient();

  // 1) Validar ownership de la purchase via session_id.
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("stripe_session_id", session_id)
    .maybeSingle();

  if (!purchase) {
    redirect("/upload");
  }

  // 2) Lookup del analysis_job para esta purchase. Inngest crea uno por
  // purchase de forma idempotente (F.4) — tomamos el más reciente por
  // si en el futuro hubiera retries con multiple jobs.
  const { data: job } = await supabase
    .from("analysis_jobs")
    .select("id")
    .eq("purchase_id", purchase.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Race condition: Inngest todavía no creó el job (ventana ~1s entre
  // webhook y create-job step). meta refresh recupera sin endpoint extra.
  if (!job) {
    return <WaitingForJob />;
  }

  return <AnalizandoClient jobId={job.id} />;
}

function WaitingForJob() {
  return (
    <>
      <meta httpEquiv="refresh" content="3" />
      <main className="dark-radial min-h-dvh flex flex-col items-center">
        <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-8 py-12 box-border mx-auto text-center">
          <Logo size={90} className="mx-auto mb-10" />

          <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.1] tracking-tight">
            Iniciando tu análisis.
          </h1>

          <p className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.55] max-w-[340px] mx-auto">
            Estamos preparando todo. Esta página se va a recargar sola en unos
            segundos.
          </p>

          <Link
            href="/"
            className="mt-16 font-dm-mono uppercase text-[10px] tracking-[0.4em] text-marfil/55 hover:text-marfil/85 transition-colors"
          >
            VOLVER AL INICIO
          </Link>
        </div>
      </main>
    </>
  );
}
