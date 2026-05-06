-- =====================================================================
-- Diosa Interior V2 — DOWN: Stripe schema extensions (E.1)
-- =====================================================================
-- Revierte 0005_stripe_purchases_webhook.sql. Borra los índices de
-- webhook_events, los 3 constraints y las 3 columnas nuevas de
-- purchases.
--
-- WARNING: data en stripe_price_id, stripe_customer_id y metadata se
-- pierde al hacer rollback. Si hay purchases reales (status='paid' con
-- Stripe ya completado), exportar las columnas a snapshot antes de
-- correr este down.
--
-- Aplicar MANUALMENTE — NO copiar a supabase/migrations/.
-- =====================================================================

-- ---------------------------------------------------------------------
-- WEBHOOK_EVENTS — DROP INDEX
-- ---------------------------------------------------------------------

DROP INDEX IF EXISTS public.idx_webhook_events_processed_at;
DROP INDEX IF EXISTS public.idx_webhook_events_type;

-- ---------------------------------------------------------------------
-- PURCHASES — DROP CONSTRAINTS antes de DROP COLUMN
-- ---------------------------------------------------------------------
-- Postgres dropearía los constraints automáticamente al borrar la
-- columna referenciada (UNIQUE), pero los CHECK no — los explicitamos
-- todos para no dejar restos del schema viejo.

ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_product_valid;
ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_status_valid;
ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_stripe_payment_intent_key;

-- ---------------------------------------------------------------------
-- PURCHASES — DROP COLUMNS
-- ---------------------------------------------------------------------

ALTER TABLE public.purchases
  DROP COLUMN IF EXISTS metadata;
ALTER TABLE public.purchases
  DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.purchases
  DROP COLUMN IF EXISTS stripe_price_id;
