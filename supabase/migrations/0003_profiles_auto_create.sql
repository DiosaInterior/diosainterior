-- =====================================================================
-- Diosa Interior V2 — Auto-create profile on auth.users INSERT
-- =====================================================================
-- Corrección retroactiva al Bloque B: el schema §5 de la biblia define
-- public.profiles con FK a auth.users y CASCADE, pero NO crea el
-- trigger que materializa el profile cuando una usuaria se registra
-- (OAuth o magic link). Resultado observado en Bloque D: cualquier
-- UPSERT en public.photos (que tiene FK a profiles, no directo a
-- auth.users) falla con "violates foreign key constraint
-- photos_user_id_fkey" porque la usuaria autenticada no tiene profile.
--
-- Solución: trigger AFTER INSERT ON auth.users que llama a
-- handle_new_user(). Función con SECURITY DEFINER (necesita permisos
-- para insertar en public.profiles desde un trigger de auth schema)
-- + search_path fijo a public (defensivo contra search_path
-- hijacking, recomendación oficial Supabase).
--
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0003_profiles_auto_create_down.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- FUNCIÓN handle_new_user
-- ---------------------------------------------------------------------
-- Materializa una fila en public.profiles desde NEW (auth.users row).
-- display_name cae en cascada:
--   raw_user_meta_data.full_name (típico de Google OAuth)
--   raw_user_meta_data.name      (fallback otros providers)
--   local-part del email         (último recurso)
-- ON CONFLICT (id) DO NOTHING: idempotente; si el backfill ya creó el
-- profile o el trigger se reaplica, no error.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- TRIGGER on_auth_user_created
-- ---------------------------------------------------------------------
-- DROP IF EXISTS antes del CREATE para que la migración sea
-- re-aplicable (Postgres 15+ soporta CREATE OR REPLACE TRIGGER pero
-- el patrón DROP+CREATE es más portable).

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- BACKFILL
-- ---------------------------------------------------------------------
-- Materializa profiles para usuarias que se registraron antes del
-- trigger (los testers del Bloque C/D, incluido César). ON CONFLICT
-- (id) DO NOTHING: idempotente; los profiles que ya existieran se
-- preservan sin sobreescribir display_name (puede haber sido editado).

INSERT INTO public.profiles (id, email, display_name)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  )
FROM auth.users
ON CONFLICT (id) DO NOTHING;
