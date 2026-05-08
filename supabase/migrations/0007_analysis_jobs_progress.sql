-- =====================================================================
-- Diosa Interior V2 — analysis_jobs progress tracking (G.0)
-- =====================================================================
-- Agrega tracking de substage al job para polling client-side
-- (G.0 → G.1 polling endpoint).
--
-- 6 substages cubren los pasos lógicos del flow F.3:
--   pending        → initial state, antes de loading
--   loading_photos → descargando 4 fotos del Storage como base64
--   calling_ai     → request a Anthropic (incluye Zod validate + hex check)
--   persisting     → INSERT del guide en BD
--   done           → guide persistida, job succeeded
--   failed         → error fatal en cualquier punto del flow
--
-- Backward compat: jobs existentes (2 rows del smoke F.3+F.5) quedan
-- con DEFAULT 'pending' tras la migration. Esos jobs ya terminaron
-- exitosamente (status='succeeded' + guide persistida) y no vuelven a
-- leerse desde la UI — el campo `substage` solo se consulta para jobs
-- nuevos creados por F.4 a partir de G.0.
--
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0007_analysis_jobs_progress_down.sql (manual)
-- =====================================================================

ALTER TABLE public.analysis_jobs
  ADD COLUMN substage TEXT NOT NULL DEFAULT 'pending'
    CHECK (substage IN (
      'pending',
      'loading_photos',
      'calling_ai',
      'persisting',
      'done',
      'failed'
    ));

-- Index para polling: la PK ya indexa por id, pero substage es útil
-- para queries futuras de monitoring ("¿cuántos jobs están atascados
-- en calling_ai?") y para el dashboard de operaciones.
CREATE INDEX idx_analysis_jobs_substage
  ON public.analysis_jobs(substage);
