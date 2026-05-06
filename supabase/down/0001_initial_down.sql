-- =====================================================================
-- Diosa Interior V2 — Down migration de 0001_initial
-- =====================================================================
-- Revierte la migración inicial. Aplicar manualmente vía SQL editor de
-- Supabase o `psql` — esta carpeta NO la escanea `supabase db push`.
--
-- Orden inverso al forward: policies → tablas hijas → tablas padre.
-- DROP TABLE ... CASCADE eliminaría también policies e índices, pero
-- los hacemos explícitos por claridad y para detectar drift.
-- =====================================================================

-- ---------------------------------------------------------------------
-- POLICIES
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "users_own_bookings" ON bookings;
DROP POLICY IF EXISTS "users_own_jobs" ON analysis_jobs;
DROP POLICY IF EXISTS "users_own_guides" ON guides;
DROP POLICY IF EXISTS "users_own_photos" ON photos;
DROP POLICY IF EXISTS "users_own_purchases" ON purchases;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;

-- ---------------------------------------------------------------------
-- ÍNDICES (los DROP TABLE los eliminarían, pero explicitamos)
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS idx_guides_user;
DROP INDEX IF EXISTS idx_purchases_user;

-- ---------------------------------------------------------------------
-- TABLAS — orden inverso al CREATE para respetar FKs
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS guides;
DROP TABLE IF EXISTS analysis_jobs;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS profiles;
