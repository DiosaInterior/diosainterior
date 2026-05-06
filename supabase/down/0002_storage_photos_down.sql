-- =====================================================================
-- Diosa Interior V2 — DOWN: storage bucket "photos" + policies
-- =====================================================================
-- Revierte 0002_storage_photos.sql. Borra las 4 policies, vacía el
-- bucket de objects y elimina la fila del bucket.
--
-- WARNING: borrar el bucket implica perder TODOS los objetos dentro
-- (los bytes en el storage físico). Coordinar con backup antes de correr.
--
-- Aplicar MANUALMENTE — NO copiar a supabase/migrations/, sino correr
-- vía psql o Supabase SQL editor.
-- =====================================================================

DROP POLICY IF EXISTS "photos_user_insert" ON storage.objects;
DROP POLICY IF EXISTS "photos_user_select" ON storage.objects;
DROP POLICY IF EXISTS "photos_user_update" ON storage.objects;
DROP POLICY IF EXISTS "photos_user_delete" ON storage.objects;

-- DELETE FROM storage.buckets falla con FK violation si hay objects
-- referenciándolo. Vaciamos primero (esto SÍ borra archivos físicos).
DELETE FROM storage.objects WHERE bucket_id = 'photos';
DELETE FROM storage.buckets WHERE id = 'photos';
