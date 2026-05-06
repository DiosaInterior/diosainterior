// Tipos compartidos entre route handlers (server) y consumidores (client)
// para tipar fetches a /api/photos/upload y /api/photos/delete sin
// duplicar el shape de las respuestas. UploadErrorCode/DeleteErrorCode
// vienen del módulo de storage; aquí extendemos el union con los códigos
// de error específicos del transporte HTTP (auth, body parsing, file
// faltante, position fuera de rango).

import type {
  DeleteErrorCode,
  Photo,
  UploadErrorCode,
} from "@/lib/storage/photos.config";

export type PhotoUploadResponse =
  | { ok: true; photo: Photo; signedUrl: string | null }
  | {
      ok: false;
      error:
        | UploadErrorCode
        | "invalid_position"
        | "no_file"
        | "invalid_body"
        | "unauthenticated";
      message?: string;
    };

export type PhotoDeleteResponse =
  | { ok: true }
  | {
      ok: false;
      error:
        | DeleteErrorCode
        | "invalid_position"
        | "invalid_body"
        | "unauthenticated";
      message?: string;
    };
