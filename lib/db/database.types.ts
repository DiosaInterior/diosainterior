// =====================================================================
// Diosa Interior V2 — Tipos generados desde el schema Postgres
// =====================================================================
// STUB temporal. Se reemplaza con el output de:
//
//   supabase gen types typescript --linked > lib/db/database.types.ts
//
// TODO (Bloque C): regenerar este archivo cuando se conecte el proyecto
// remoto Supabase. Mientras tanto, los clients usan `Database = any`
// para no bloquear desarrollo.
// =====================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
