// =====================================================================
// Stripe webhook event handlers (server-only)
// =====================================================================
// `handleStripeEvent(event)` despacha el Stripe.Event al handler
// específico según event.type. Eventos no manejados se ignoran
// gracefully (return ok:true, ignored:true) para que el route responda
// 200 a Stripe y NO reintente.
//
// Eventos soportados en E.4:
//  - checkout.session.completed → marca purchase como 'paid'
//  - payment_intent.payment_failed → marca purchase como 'failed'
//
// Defensa-en-profundidad por handler:
//  1) Validar metadata.purchase_id presente (sin él, no sabemos qué fila tocar).
//  2) Validar ownership: purchase.user_id === session.client_reference_id
//     (defensa contra metadata tampering — un atacante podría enviar
//     un purchase_id ajeno).
//  3) Idempotencia secundaria: UPDATE ... WHERE status='pending'.
//     Si un evento se procesa dos veces (orden raro de Stripe retries),
//     el segundo UPDATE no toca filas ya en 'paid'.
// =====================================================================

import "server-only";
import type Stripe from "stripe";

import { inngest } from "@/inngest/client";
import { eventIdFromPurchase } from "@/lib/analytics/event-id-server";
import { sendCapiEvent } from "@/lib/analytics/meta-capi";
import { getAdminClient } from "@/lib/db/admin";
import { APP_URL } from "./config";
import { getStripe } from "./client";

export type WebhookHandlerResult =
  | { ok: true; ignored?: boolean }
  | { ok: false; error: string };

export async function handleStripeEvent(
  event: Stripe.Event,
): Promise<WebhookHandlerResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
    case "payment_intent.payment_failed":
      return handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
    default:
      // Tipo de evento que aún no manejamos. 200 + ignored para no
      // hacer que Stripe reintente.
      return { ok: true, ignored: true };
  }
}

// ---------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<WebhookHandlerResult> {
  const purchaseId = session.metadata?.purchase_id;
  const userId = session.client_reference_id;

  if (!purchaseId) {
    console.warn(
      "[webhook] checkout.session.completed sin metadata.purchase_id",
      { sessionId: session.id },
    );
    return { ok: true, ignored: true };
  }
  if (!userId) {
    console.warn(
      "[webhook] checkout.session.completed sin client_reference_id",
      { sessionId: session.id },
    );
    return { ok: true, ignored: true };
  }

  const supabase = getAdminClient();

  // Ownership check: purchase.user_id debe matchear session.client_reference_id.
  const { data: existing, error: lookupError } = await supabase
    .from("purchases")
    .select("user_id")
    .eq("id", purchaseId)
    .maybeSingle();

  if (lookupError) {
    return {
      ok: false,
      error: `db_lookup_failed: ${lookupError.message}`,
    };
  }
  if (!existing) {
    console.warn("[webhook] purchase no encontrada", { purchaseId });
    return { ok: true, ignored: true };
  }
  if (existing.user_id !== userId) {
    console.error("[webhook] ownership mismatch en checkout completed", {
      purchaseId,
      sessionUserId: userId,
      purchaseUserId: existing.user_id,
    });
    return { ok: true, ignored: true };
  }

  const { error: updateError } = await supabase
    .from("purchases")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent: extractId(session.payment_intent),
      stripe_customer_id: extractId(session.customer),
      // amount_total viene en cents desde Stripe — se actualiza al valor
      // real cobrado (puede divergir del hardcoded si hay taxes/discounts).
      amount_cents: session.amount_total ?? undefined,
      metadata: {
        stripe_session_id: session.id,
        payment_status: session.payment_status,
      },
    })
    .eq("id", purchaseId)
    .eq("status", "pending");

  if (updateError) {
    return {
      ok: false,
      error: `db_update_failed: ${updateError.message}`,
    };
  }

  // G.7 — Meta CAPI 'Purchase' fire-and-forget.
  //
  // NO IP/UA: el webhook recibe request del servidor de Stripe, no del
  // browser de la usuaria. Email del checkout session es identifier
  // suficiente per Meta CAPI docs (al menos un campo de PII hashed).
  //
  // event_id determinístico desde purchase_id → idempotencia si Stripe
  // reentregar el webhook. Meta deduplica por event_id en ventana ~7d.
  //
  // value: amount_total real (incluye descuentos como cesar100 100% off
  // → value=0). currency siempre MXN per producto base.
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? undefined;
  const purchaseValue = (session.amount_total ?? 0) / 100;
  sendCapiEvent({
    eventName: "Purchase",
    eventId: eventIdFromPurchase(purchaseId),
    userData: { email: customerEmail },
    customData: {
      value: purchaseValue,
      currency: session.currency?.toUpperCase() ?? "MXN",
      content_type: "product",
      content_ids: ["base-guide"],
    },
    eventSourceUrl: `${APP_URL}/upload`,
  }).catch(() => {
    // sendCapiEvent loguea a Sentry. Caller no se entera.
  });

  // Emitir evento a Inngest para encolar el análisis colorimétrico (F.4).
  // Defense in depth: webhook_events.id ya provee idempotencia primaria;
  // pasamos `id: purchase-paid-<purchaseId>` como segundo nivel — Inngest
  // deduplica eventos con misma id durante 24h.
  // Si inngest.send falla, NO devolvemos 500 a Stripe — el purchase ya
  // quedó marcado paid. Loggeamos y dejamos que el alerting externo
  // (Sentry) o un retry manual recupere.
  try {
    await inngest.send({
      id: `purchase-paid-${purchaseId}`,
      name: "purchase/paid",
      data: {
        purchaseId,
        userId,
      },
    });
  } catch (sendError) {
    console.error(
      `[F.4] inngest.send failed for purchase ${purchaseId}:`,
      sendError,
    );
    // No re-throw: el webhook devuelve OK al final.
  }

  return { ok: true };
}

// ---------------------------------------------------------------------
// payment_intent.payment_failed
// ---------------------------------------------------------------------

export async function handlePaymentFailed(
  intent: Stripe.PaymentIntent,
): Promise<WebhookHandlerResult> {
  // El PaymentIntent NO tiene metadata propia (la setteamos sólo en la
  // Session). Buscamos la Session asociada vía Stripe API para extraer
  // purchase_id y client_reference_id.
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: intent.id,
    limit: 1,
  });
  const session = sessions.data[0];

  if (!session) {
    console.warn("[webhook] payment_intent sin Checkout Session asociada", {
      intentId: intent.id,
    });
    return { ok: true, ignored: true };
  }

  const purchaseId = session.metadata?.purchase_id;
  const userId = session.client_reference_id;

  if (!purchaseId || !userId) {
    console.warn(
      "[webhook] session sin metadata.purchase_id / client_reference_id",
      { sessionId: session.id, intentId: intent.id },
    );
    return { ok: true, ignored: true };
  }

  const supabase = getAdminClient();

  const { data: existing, error: lookupError } = await supabase
    .from("purchases")
    .select("user_id")
    .eq("id", purchaseId)
    .maybeSingle();

  if (lookupError) {
    return {
      ok: false,
      error: `db_lookup_failed: ${lookupError.message}`,
    };
  }
  if (!existing) {
    return { ok: true, ignored: true };
  }
  if (existing.user_id !== userId) {
    console.error("[webhook] ownership mismatch en payment failed", {
      purchaseId,
    });
    return { ok: true, ignored: true };
  }

  const lastError = intent.last_payment_error;
  const { error: updateError } = await supabase
    .from("purchases")
    .update({
      status: "failed",
      stripe_payment_intent: intent.id,
      metadata: {
        stripe_session_id: session.id,
        last_payment_error: lastError
          ? {
              code: lastError.code ?? null,
              decline_code: lastError.decline_code ?? null,
              message: lastError.message ?? null,
            }
          : null,
      },
    })
    .eq("id", purchaseId)
    .eq("status", "pending");

  if (updateError) {
    return {
      ok: false,
      error: `db_update_failed: ${updateError.message}`,
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
// Stripe campos como `customer` y `payment_intent` pueden venir como
// string id o como objeto expandido — extraemos el id con type guard.

function extractId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
