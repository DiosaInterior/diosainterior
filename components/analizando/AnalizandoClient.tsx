"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/brand/Logo";

import { calcProgressPercent, copyForSubstage } from "./_progress";
import { useJobPolling } from "./useJobPolling";

const REDIRECT_DELAY_MS = 1500;

type Props = {
  jobId: string;
};

export function AnalizandoClient({ jobId }: Props) {
  const router = useRouter();
  const { substage, status, errorMessage, substageStartedAt, timedOut } =
    useJobPolling(jobId);

  // Auto-redirect a /mi-guia cuando el job entra en substage='done'.
  // Delay 1.5s para que la usuaria vea la barra al 100% antes del cambio.
  useEffect(() => {
    if (substage !== "done") return;
    const timer = setTimeout(() => {
      router.push("/mi-guia");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [substage, router]);

  if (status === "failed") {
    return <FailedState errorMessage={errorMessage} />;
  }

  if (timedOut) {
    return <TimedOutState />;
  }

  const effectiveSubstage = substage ?? "pending";
  const percent = calcProgressPercent(effectiveSubstage, substageStartedAt);
  const copy = copyForSubstage(effectiveSubstage);

  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-8 py-12 box-border mx-auto text-center">
        <Logo size={90} className="mx-auto mb-10" />

        <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.1] tracking-tight">
          Tu análisis está en proceso.
        </h1>

        <p
          className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.55] max-w-[340px] mx-auto transition-opacity duration-300"
          aria-live="polite"
        >
          {copy}
        </p>

        <div
          className="mt-10 w-full max-w-[280px] mx-auto h-px bg-marfil/15 relative"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del análisis"
        >
          <div
            className="progress-fill absolute left-0 top-0"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="font-dm-mono uppercase text-[10px] tracking-[0.4em] text-marfil/55 mt-4">
          {percent}%
        </p>

        <p className="font-raleway text-[15px] text-marfil/85 mt-12 leading-[1.55] max-w-[340px] mx-auto">
          Puedes cerrar esta página y volver cuando quieras — tu guía estará
          aquí.
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

function FailedState({ errorMessage }: { errorMessage: string | null }) {
  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-8 py-12 box-border mx-auto text-center">
        <Logo size={90} className="mx-auto mb-10" />

        <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.1] tracking-tight">
          Algo no salió como esperábamos.
        </h1>

        <p className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.55] max-w-[340px] mx-auto">
          Tu pago está confirmado. El análisis tuvo un problema técnico que
          estamos investigando.
        </p>

        {errorMessage && (
          <p className="font-dm-mono text-[11px] text-marfil/45 mt-6 max-w-[300px] mx-auto break-words">
            {errorMessage}
          </p>
        )}

        <p className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.55] max-w-[340px] mx-auto">
          Escríbenos y resolvemos esto contigo.
        </p>

        <a
          href="mailto:hola@diosainterior.app"
          className="mt-12 font-dm-mono uppercase text-[10px] tracking-[0.4em] text-terra-diosa hover:text-terra-2 transition-colors"
        >
          HOLA@DIOSAINTERIOR.APP
        </a>
      </div>
    </main>
  );
}

function TimedOutState() {
  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-8 py-12 box-border mx-auto text-center">
        <Logo size={90} className="mx-auto mb-10" />

        <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.1] tracking-tight">
          Tu análisis está tardando más de lo normal.
        </h1>

        <p className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.55] max-w-[340px] mx-auto">
          A veces la cola está concurrida. Refresca esta página en unos minutos
          — tu guía aparecerá cuando esté lista.
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
