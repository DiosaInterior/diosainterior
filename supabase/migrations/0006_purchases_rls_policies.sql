-- =====================================================================
-- Diosa Interior V2 — Purchases RLS: INSERT + UPDATE policies (E.6 fix)
-- =====================================================================
-- Bug fix: el Bloque B (0001_initial.sql) habilitó RLS en purchases y
-- creó solo una policy de SELECT (users_own_purchases). Sin policies
-- para INSERT y UPDATE, cualquier mutación desde la sesión cookie de la
-- usuaria fallaba con
-- "new row violates row-level security policy for table purchases".
--
-- Detectado en E.6 al probar /api/checkout/create-session en producción
-- (logs de Supabase). Los tests unitarios no lo cazaron porque mockean
-- el supabase client.
--
-- El service-role client (webhooks vía lib/db/admin.ts) bypasea RLS y
-- no necesita policies adicionales — sigue funcionando con o sin éstas.
--
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0006_purchases_rls_policies_down.sql
-- =====================================================================

-- INSERT — la usuaria sólo puede crear purchases con su propio user_id.
-- El route handler /api/checkout/create-session usa la sesión cookie y
-- pasa user_id = user.id (verificado vía getUser arriba). Esta policy
-- es la garantía DB-level de que esa invariante se respeta.
CREATE POLICY "users_insert_own_purchases"
  ON public.purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE — la usuaria sólo puede modificar sus propias purchases.
-- USING filtra qué filas son visibles para UPDATE (igual semántica que
-- SELECT); WITH CHECK valida la fila resultante. Aplicamos la misma
-- condición a ambas para impedir que una usuaria mueva un purchase a
-- otro user_id vía UPDATE.
CREATE POLICY "users_update_own_purchases"
  ON public.purchases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
