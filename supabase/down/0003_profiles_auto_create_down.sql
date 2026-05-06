-- =====================================================================
-- Diosa Interior V2 — DOWN: profiles auto-create
-- =====================================================================
-- Revierte 0003_profiles_auto_create.sql. Borra el trigger y la función.
--
-- IMPORTANTE: el backfill NO se revierte. Los rows materializados en
-- public.profiles pueden tener data legítima posterior (display_name
-- editado por la usuaria, country setteado, etc.) y borrarlos en
-- cascada destruiría purchases/photos/guides relacionados (FK CASCADE).
-- Si necesitás limpiar profiles huérfanos por separado, hay que hacerlo
-- a mano con criterio (ej. solo donde created_at coincide con el
-- backfill y no hay actividad relacionada).
--
-- Aplicar MANUALMENTE — NO copiar a supabase/migrations/.
-- =====================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
