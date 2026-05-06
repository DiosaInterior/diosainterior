// POST /api/checkout/create-session
//
// Sin body. Auth via cookies. Flow:
//  1) getUser → 401 si no hay sesión.
//  2) count(photos) — debe ser >=4 (else no_photos / incomplete_photos).
//  3) Idempotencia: busca la pending purchase más reciente (<1h);
//     si Stripe confirma que la session sigue `open`, devuelve esa URL.
//  4) Si no hay recovery, marca TODAS las pending de esta usuaria como
//     'failed' (limpieza), inserta una nueva pending, llama a Stripe.
//  5) Si Stripe falla, marca la nueva como 'failed' y retorna 500.
//  6) Si OK, actualiza la purchase con stripe_session_id y retorna 200.

import { NextResponse } from "next/server";

import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/db/server";
import type { CheckoutSessionResponse } from "@/lib/api/checkout.types";
import {
  createCheckoutSession,
  retrieveSessionUrl,
} from "@/lib/stripe/checkout";
import {
  STRIPE_AMOUNT_BASE_CENTS,
  STRIPE_PRICE_ID_BASE,
} from "@/lib/stripe/config";

const PENDING_REUSE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

// El endpoint no lee body; la usuaria se identifica vía cookie de sesión.
// Por eso POST no declara el param `request`.
export async function POST(): Promise<NextResponse<CheckoutSessionResponse>> {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  const supabase = await createClient();

  // 1) Validar que la usuaria tiene 4 fotos
  const { count: photoCount, error: countError } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json(
      { ok: false, error: "db_failed", message: countError.message },
      { status: 500 },
    );
  }
  if (!photoCount || photoCount === 0) {
    return NextResponse.json(
      { ok: false, error: "no_photos" },
      { status: 400 },
    );
  }
  if (photoCount < 4) {
    return NextResponse.json(
      { ok: false, error: "incomplete_photos" },
      { status: 400 },
    );
  }

  // 2) Idempotencia: pending más reciente (<1h) con session recoverable
  const recentSince = new Date(
    Date.now() - PENDING_REUSE_WINDOW_MS,
  ).toISOString();
  const { data: recentPending, error: pendingError } = await supabase
    .from("purchases")
    .select("id, stripe_session_id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gte("created_at", recentSince)
    .order("created_at", { ascending: false })
    .limit(1);

  if (pendingError) {
    return NextResponse.json(
      { ok: false, error: "db_failed", message: pendingError.message },
      { status: 500 },
    );
  }

  const recoverable = recentPending?.[0] ?? null;
  if (recoverable?.stripe_session_id) {
    const url = await retrieveSessionUrl(recoverable.stripe_session_id);
    if (url) {
      return NextResponse.json({ ok: true, url }, { status: 200 });
    }
  }

  // 3) Marcar TODAS las pending (recientes y viejas) como failed antes
  // de crear una nueva — evita huérfanos y limpia state.
  await supabase
    .from("purchases")
    .update({ status: "failed" })
    .eq("user_id", user.id)
    .eq("status", "pending");

  // 4) Insertar nueva pending purchase
  const { data: newPurchase, error: insertError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      product: "base",
      amount_cents: STRIPE_AMOUNT_BASE_CENTS,
      currency: "mxn",
      status: "pending",
      stripe_price_id: STRIPE_PRICE_ID_BASE,
    })
    .select("id")
    .single();

  if (insertError || !newPurchase) {
    return NextResponse.json(
      { ok: false, error: "db_failed", message: insertError?.message },
      { status: 500 },
    );
  }

  // 5) Crear Stripe Checkout Session
  const session = await createCheckoutSession({
    userId: user.id,
    purchaseId: newPurchase.id,
  });

  if (!session.ok) {
    await supabase
      .from("purchases")
      .update({
        status: "failed",
        metadata: { error: session.message },
      })
      .eq("id", newPurchase.id);
    return NextResponse.json(
      { ok: false, error: "stripe_failed", message: session.message },
      { status: 500 },
    );
  }

  // 6) Persistir el session_id; la URL se retorna al cliente para redirect.
  await supabase
    .from("purchases")
    .update({ stripe_session_id: session.sessionId })
    .eq("id", newPurchase.id);

  return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
}
