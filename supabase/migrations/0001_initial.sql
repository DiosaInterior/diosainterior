-- =====================================================================
-- Diosa Interior V2 — Migración inicial
-- =====================================================================
-- Schema canónico según biblia §5 (BIBLIA_APP_V2_DIOSA_INTERIOR.md).
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0001_initial_down.sql (manual)
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------------

-- Usuarias (manejado por Supabase Auth, extendido con perfil)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  country TEXT, -- 'MX' | 'CO' | 'AR' | etc — para analítica regional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compras (fuente de verdad del pago — P1)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product TEXT NOT NULL, -- 'base' | 'wedding' | 'quinceanera' | 'session'
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'mxn',
  status TEXT NOT NULL, -- 'pending' | 'paid' | 'refunded' | 'failed'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON purchases(user_id, status);

-- Fotos subidas (referencias a Supabase Storage — los bytes no viven aquí)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- 'users/<uid>/photo_1.jpg'
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position)
);

-- Jobs de análisis (estado del procesamiento IA asíncrono — P3)
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued' | 'running' | 'succeeded' | 'failed'
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  prompt_version TEXT NOT NULL, -- '2.0', '2.1' — para A/B testing
  model TEXT NOT NULL, -- 'claude-sonnet-4-5'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guías generadas (resultado final — fuente de verdad de la guía)
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES analysis_jobs(id),
  -- Datos del análisis colorimétrico
  fitzpatrick INTEGER CHECK (fitzpatrick BETWEEN 1 AND 6),
  season TEXT, -- 'true_spring' | 'warm_autumn' | etc
  undertone TEXT, -- 'warm_golden' | 'neutral_olive' | etc
  munsell_notation TEXT, -- '5YR 6/4' por ejemplo
  cie_lab JSONB, -- {L: 65, a: 12, b: 20}
  -- Resultado completo (JSON validado por Zod)
  data JSONB NOT NULL,
  -- Versionado
  prompt_version TEXT NOT NULL,
  app_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guides_user ON guides(user_id);

-- Webhooks procesados (idempotencia — P5)
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY, -- stripe event id
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);

-- Citas (reemplaza Formspree de V1)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- CORRECCIÓN A LA BIBLIA: la biblia §5 omite habilitar RLS y crear policy
-- para `bookings`. Sin esto, cualquier usuaria autenticada podría leer las
-- citas de cualquier otra. Lo añadimos aquí. Pendiente: propagar este
-- cambio a /docs/BIBLIA_APP_V2_DIOSA_INTERIOR.md §5 después del Bloque B.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Cada usuaria solo ve lo suyo
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_photos" ON photos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_guides" ON guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_jobs" ON analysis_jobs FOR SELECT USING (auth.uid() = user_id);

-- CORRECCIÓN A LA BIBLIA (continuación): policy de bookings.
-- SELECT-only para el cliente: alineado con P2 (frontend nunca decide
-- nada crítico). Los INSERT de citas pasan por route handler con service
-- role key. Las bookings con user_id NULL (guest) solo son visibles vía
-- backend con service role.
CREATE POLICY "users_own_bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
