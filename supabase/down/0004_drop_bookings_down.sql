-- =====================================================================
-- Diosa Interior V2 — DOWN: recrear tabla bookings (E.0)
-- =====================================================================
-- Revierte 0004_drop_bookings.sql. Restaura la estructura original
-- (idéntica a 0001_initial.sql §bookings) para no dejar el schema
-- roto si alguien hace rollback.
--
-- NOTA: el down NO restaura data — que estaba vacía cuando se aplicó
-- el up (el guard SQL lo garantiza). Solo restaura el shape.
--
-- Aplicar MANUALMENTE — NO copiar a supabase/migrations/.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);
