// =====================================================================
// POST /api/webhooks/stripe — recibe eventos de Stripe
// =====================================================================
// Flow:
//  1) Lee body crudo con request.text() (NUNCA .json()).
//  2) Verifica firma con stripe.webhooks.constructEvent.
//  3) Idempotencia primaria: upsert en webhook_events con
//     onConflict ignoreDuplicates. Si select() devuelve [], es duplicado.
//  4) Si nuevo, despacha al handler vía handleStripeEvent.
//  5) Responde 200 a Stripe (excepto: firma inválida = 400, server
//     error = 500). Stripe reintenta solo en non-2xx — devolver 200
//     en eventos ignorados (tipo desconocido, ownership mismatch, etc)
//     evita reintentos inútiles.
//
// runtime "nodejs": el SDK de Stripe usa Node APIs (Buffer, crypto)
// que no existen en Edge.
// dynamic "force-dynamic": el webhook NO debe cachearse jamás.
// =====================================================================

import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getAdminClient } from "@/lib/db/admin";
import { getStripe } from "@/lib/stripe/client";
import { handleStripeEvent } from "@/lib/stripe/webhook";
import type { Json } from "@/lib/db/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "missing_signature" },
      { status: 400 },
    );
  }

  // Body crudo: NO podemos usar request.json() porque la verificación
  // de firma de Stripe se hace contra los bytes EXACTOS que envió.
  // Re-serializar via .json() pierde whitespace y reordena keys, rompiendo
  // el HMAC. .text() devuelve el body sin tocar.
  const rawBody = await request.text();

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET no setteado");
    return NextResponse.json(
      { ok: false, error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[webhook] firma inválida", { error: message });
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 400 },
    );
  }

  // Idempotencia primaria: webhook_events.id es PK. Upsert con
  // ignoreDuplicates devuelve los rows insertados (vacío si ya existía).
  const supabase = getAdminClient();
  const { data: insertedRows, error: insertError } = await supabase
    .from("webhook_events")
    .upsert(
      {
        id: event.id,
        type: event.type,
        payload: event as unknown as Json,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");

  if (insertError) {
    console.error("[webhook] error al persistir webhook_events", {
      eventId: event.id,
      error: insertError,
    });
    return NextResponse.json(
      { ok: false, error: "db_failed", message: insertError.message },
      { status: 500 },
    );
  }

  if (!insertedRows || insertedRows.length === 0) {
    // Evento ya procesado antes — Stripe reenvía a veces. 200 OK,
    // marca como duplicate para que se vea claro en logs si miramos.
    return NextResponse.json(
      { ok: true, duplicate: true },
      { status: 200 },
    );
  }

  // Primer procesamiento del evento.
  const result = await handleStripeEvent(event);
  if (!result.ok) {
    console.error("[webhook] handler falló", {
      eventId: event.id,
      type: event.type,
      error: result.error,
    });
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
