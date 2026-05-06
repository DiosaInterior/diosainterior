-- =====================================================================
-- Diosa Interior V2 — DROP tabla bookings (E.0)
-- =====================================================================
-- bookings se descartó del scope V2 cuando confirmamos que el producto
-- es solo "Diosa Interior" base, sin Hyperpersonalized Sessions ni
-- otros productos que requirieran reservas con fecha. La tabla nunca
-- se usó desde código aplicacional (verificado con grep en app/,
-- components/, lib/, tests/ — sólo aparece en database.types.ts
-- auto-generado y en docs/BIBLIA_APP_V2_DIOSA_INTERIOR.md).
--
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0004_drop_bookings_down.sql (manual)
-- =====================================================================

-- ---------------------------------------------------------------------
-- GUARD
-- ---------------------------------------------------------------------
-- Aborta si la tabla tiene data (paranoia defensiva). Si algún beta
-- tester o testing manual insertó algo, hay que exportar antes de
-- borrar. RAISE EXCEPTION cancela la migración entera (transaction
-- rollback automático en supabase db push).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bookings LIMIT 1) THEN
    RAISE EXCEPTION 'bookings table is not empty — aborting DROP. Export data first or confirm intent.';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- DROP
-- ---------------------------------------------------------------------
-- DROP POLICY antes de DROP TABLE es redundante (DROP TABLE cascadea
-- las policies) pero explícito es más limpio y reporta error claro si
-- el orden de aplicación importa. La FK bookings_user_id_fkey se va
-- con el DROP TABLE.

DROP POLICY IF EXISTS "users_own_bookings" ON public.bookings;
ALTER TABLE IF EXISTS public.bookings DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.bookings;
