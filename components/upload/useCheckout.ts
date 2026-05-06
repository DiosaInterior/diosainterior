"use client";

// Hook para disparar el flow de Stripe Checkout desde la UI.
// Se separa del useSlotMutations (que cubre upload/delete de fotos)
// porque el checkout tiene su propio loading state y su propio mapping
// de errores; mezclarlos crece la API del hook sin razón.
//
// performCheckout() está extraído como pure-ish function (sin React)
// para permitir tests sin renderHook ni RTL — recibe setLoading + toast
// + pushPath como dependencias inyectadas. useCheckout() lo envuelve
// para integrarlo con useState + useRouter.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { CheckoutSessionResponse } from "@/lib/api/checkout.types";

import { checkoutFailureToToast } from "./_errors";

const REDIRECT_DELAY_MS = 800;

type Toast = (msg: string) => void;
type PushPath = (path: string) => void;

export async function performCheckout(opts: {
  toast: Toast;
  pushPath: PushPath;
  setLoading: (loading: boolean) => void;
}): Promise<void> {
  opts.setLoading(true);

  let body: CheckoutSessionResponse;
  try {
    const res = await fetch("/api/checkout/create-session", {
      method: "POST",
    });
    body = (await res.json()) as CheckoutSessionResponse;
  } catch {
    opts.setLoading(false);
    opts.toast("Error de red. Intenta de nuevo.");
    return;
  }

  if (!body.ok) {
    opts.setLoading(false);
    const { message, triggerLogin } = checkoutFailureToToast(body.error);
    opts.toast(message);
    if (triggerLogin) {
      setTimeout(() => opts.pushPath("/login"), REDIRECT_DELAY_MS);
    }
    return;
  }

  // Happy path: hard redirect a URL externa de Stripe. checkoutLoading
  // se queda true a propósito porque el browser está por navegar fuera
  // — setearlo a false generaría flash de UI antes del redirect.
  window.location.href = body.url;
}

type Router = ReturnType<typeof useRouter>;

type Opts = {
  toast: Toast;
  router: Router;
};

export function useCheckout({ toast, router }: Opts) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = useCallback(() => {
    return performCheckout({
      toast,
      pushPath: router.push,
      setLoading: setCheckoutLoading,
    });
  }, [toast, router]);

  return { handleCheckout, checkoutLoading };
}
