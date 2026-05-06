// Tipos compartidos entre el route handler de checkout (server) y
// consumidores (client) para tipar fetches a /api/checkout/create-session
// sin duplicar el shape.

export type CheckoutErrorCode =
  | "unauthenticated"
  | "no_photos"
  | "incomplete_photos"
  | "stripe_failed"
  | "db_failed";

export type CheckoutSessionResponse =
  | { ok: true; url: string }
  | { ok: false; error: CheckoutErrorCode; message?: string };
