-- =====================================================================
-- Diosa Interior V2 — Stripe schema extensions (E.1)
-- =====================================================================
-- Extiende `purchases` con columnas necesarias para el flow de Stripe
-- Checkout (price_id, customer_id, metadata snapshot), añade UNIQUE +
-- CHECK constraints para idempotencia y enforcement de enums, y crea
-- índices de query sobre `webhook_events` (que se mantiene UNRESTRICTED
-- por diseño — biblia v2.5: backend exclusivo via service_role).
--
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0005_stripe_purchases_webhook_down.sql
--                (manual; columnas nuevas pierden data al rollback)
-- =====================================================================

-- ---------------------------------------------------------------------
-- PURCHASES — columnas nuevas
-- ---------------------------------------------------------------------
-- Las 3 son nullable: rows existentes (testing manual) no se quedan
-- con basura; rows nuevas via Stripe Checkout las llenan al crear la
-- session y al recibir el webhook.
--
-- stripe_price_id: el Price de Stripe que se cobró (ej. price_1TU7XaG...).
--   Útil para analytics ("¿cuál variante se vende más?") y refund logic
--   (cada Price tiene su propia política de reembolso).
-- stripe_customer_id: para clientas recurrentes — Stripe permite
--   asociar Sessions a Customers.
-- metadata: snapshot JSONB del Stripe session/payment_intent recibido,
--   sin parsear. DEFAULT '{}' para que rows nuevas tengan al menos
--   objeto vacío y los queries con `metadata->>'foo'` no lidien con NULL.

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------
-- PURCHASES — UNIQUE on stripe_payment_intent
-- ---------------------------------------------------------------------
-- El 0001 le puso UNIQUE a stripe_session_id pero no a payment_intent.
-- En Stripe, un mismo PaymentIntent solo debería cerrar una purchase;
-- garantizamos eso a nivel DB. NULL allowed (Postgres permite múltiples
-- NULL en UNIQUE) — purchases con status='pending' aún no tienen PI.
--
-- Patrón DROP+ADD para idempotencia (ALTER TABLE no soporta
-- ADD CONSTRAINT IF NOT EXISTS).

ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_stripe_payment_intent_key;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_stripe_payment_intent_key
  UNIQUE (stripe_payment_intent);

-- ---------------------------------------------------------------------
-- PURCHASES — CHECK constraints (defense-in-depth)
-- ---------------------------------------------------------------------
-- En 0001 estos enums vivían como comentarios SQL, no enforzados.
-- Ahora son CHECK reales. Si alguien (o un bug en código) intenta
-- meter un status/product fuera de la lista, la DB rechaza.
--
-- product permanece abierto a 4 valores aunque V2 solo usa 'base':
-- el shape queda listo para wedding/quinceanera/session sin migrar.

ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_status_valid;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_status_valid
  CHECK (status IN ('pending', 'paid', 'refunded', 'failed'));

ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_product_valid;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_product_valid
  CHECK (product IN ('base', 'wedding', 'quinceanera', 'session'));

-- ---------------------------------------------------------------------
-- WEBHOOK_EVENTS — índices
-- ---------------------------------------------------------------------
-- Sin RLS por diseño (biblia v2.5: tabla exclusiva del backend con
-- service_role). El webhook handler usa INSERT ... ON CONFLICT (id)
-- DO NOTHING para idempotencia, y queries de monitoreo filtran por
-- type y processed_at.
--
-- type: ej. 'checkout.session.completed', 'payment_intent.succeeded'.
-- processed_at: para purgas de eventos viejos y ventanas de auditoría.

CREATE INDEX IF NOT EXISTS idx_webhook_events_type
  ON public.webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events(processed_at);
