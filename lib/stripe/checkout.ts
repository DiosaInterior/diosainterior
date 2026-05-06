// =====================================================================
// Stripe — Checkout helpers (server-only)
// =====================================================================
// Wrappers tipados sobre `stripe.checkout.sessions.create/retrieve` para:
//  - Crear sesiones con args canónicos (mode payment, line_items, urls,
//    metadata, idempotency key con granularidad 1 minuto).
//  - Recuperar la URL de una session existente al hacer retry idempotente
//    desde el route handler (devolver MISMA url si la usuaria reintenta).
//
// "import 'server-only'" arriba: la SECRET key vive sólo en server.
// =====================================================================

import "server-only";

import { getStripe } from "./client";
import {
  APP_URL,
  STRIPE_PRICE_ID_BASE,
} from "./config";

type CreateSessionResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: "stripe_failed"; message: string };

/**
 * Crea una Stripe Checkout Session para el producto base ($499 MXN).
 *
 * idempotencyKey = `checkout_${userId}_${minuteBucket}`. Si la usuaria
 * dispara dos requests dentro del mismo minuto, Stripe devuelve la
 * MISMA session — defensa contra doble click cliente que slip past los
 * checks de DB.
 *
 * success_url:  ${APP_URL}/analizando?session_id={CHECKOUT_SESSION_ID}
 * cancel_url:   ${APP_URL}/upload?canceled=1
 */
export async function createCheckoutSession(opts: {
  userId: string;
  purchaseId: string;
}): Promise<CreateSessionResult> {
  const stripe = getStripe();
  const minuteBucket = Math.floor(Date.now() / 60000);
  const idempotencyKey = `checkout_${opts.userId}_${minuteBucket}`;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price: STRIPE_PRICE_ID_BASE, quantity: 1 }],
        client_reference_id: opts.userId,
        metadata: {
          purchase_id: opts.purchaseId,
          user_id: opts.userId,
        },
        success_url: `${APP_URL}/analizando?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/upload?canceled=1`,
      },
      { idempotencyKey },
    );

    if (!session.url) {
      return {
        ok: false,
        error: "stripe_failed",
        message: "Session created without URL",
      };
    }
    return { ok: true, url: session.url, sessionId: session.id };
  } catch (error) {
    return {
      ok: false,
      error: "stripe_failed",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Recupera la URL de una Checkout Session existente, sólo si sigue en
 * estado `open` (la usuaria puede pagar). Si está expired/complete o
 * Stripe lanza, devuelve null y el caller debe crear una session nueva.
 */
export async function retrieveSessionUrl(
  sessionId: string,
): Promise<string | null> {
  const stripe = getStripe();
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status === "open" && session.url) {
      return session.url;
    }
    return null;
  } catch {
    return null;
  }
}
