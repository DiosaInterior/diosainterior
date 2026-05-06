-- =====================================================================
-- Diosa Interior V2 — DOWN: purchases RLS policies (E.6 fix)
-- =====================================================================
-- Revierte 0006_purchases_rls_policies.sql. Sin estas policies, el
-- INSERT/UPDATE de purchases desde la sesión cookie de la usuaria
-- vuelve a fallar (regresión al estado bug del Bloque B).
--
-- El service-role client (webhooks) sigue funcionando porque bypasea
-- RLS independientemente de las policies.
--
-- Aplicar MANUALMENTE — NO copiar a supabase/migrations/.
-- =====================================================================

DROP POLICY IF EXISTS "users_update_own_purchases" ON public.purchases;
DROP POLICY IF EXISTS "users_insert_own_purchases" ON public.purchases;
