-- =====================================================================
-- Diosa Interior V2 — Storage: bucket "photos" + RLS policies
-- =====================================================================
-- Crea el bucket privado donde viven las 4 fotos de cada usuaria, con
-- RLS estricto: cada usuaria solo lee/escribe paths que empiecen por su
-- user_id. El backend con service_role bypasea RLS y puede leer todas
-- las fotos para el job de análisis IA.
--
-- Path convention: {user_id}/{slot}.{ext}
--   slot ∈ {frontal, perfil_derecho, perfil_izquierdo, manos}
--   ext  ∈ {jpg, png, heic, webp}
--
-- Aplica con: supabase db push
-- Revertir con: supabase/down/0002_storage_photos_down.sql (manual)
-- =====================================================================

-- ---------------------------------------------------------------------
-- BUCKET
-- ---------------------------------------------------------------------
-- storage.buckets es una tabla, no un objeto DDL — se crea con INSERT.
-- public=false: ninguna URL pública directa; todo acceso pasa por
-- RLS o por URLs firmadas generadas server-side.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  10485760, -- 10 MB; fotos cámara móvil pesan 3–8 MB típicamente
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- storage.objects ya tiene RLS habilitado por default en Supabase y la
-- tabla pertenece al rol supabase_admin: no hace falta (ni se puede)
-- ejecutar ALTER TABLE ... ENABLE ROW LEVEL SECURITY desde la conexión
-- de `supabase db push` — falla con "must be owner of table objects".
-- Las policies de abajo se aplican sobre la RLS preexistente.
--
-- storage.foldername(name) descompone el path por "/" y devuelve text[].
-- Para 'a1b2c3d4-.../frontal.jpg' devuelve {a1b2c3d4-..., frontal.jpg}.
-- El índice [1] (1-based en Postgres) es el primer folder = el user_id.
-- Si el primer segmento no es un UUID válido el cast falla y la policy
-- niega — comportamiento deseado para paths con forma incorrecta.

-- INSERT — la usuaria solo puede subir a su propio folder
CREATE POLICY "photos_user_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- SELECT — la usuaria solo puede leer fotos de su propio folder
CREATE POLICY "photos_user_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- UPDATE — la usuaria solo puede reemplazar sus propias fotos.
-- USING filtra qué filas son visibles para actualizar; WITH CHECK valida
-- la fila resultante. Aplicamos la misma condición a ambas para evitar
-- que se mueva un objeto a otro folder vía rename.
CREATE POLICY "photos_user_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- DELETE — la usuaria solo puede borrar fotos de su propio folder
CREATE POLICY "photos_user_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );
