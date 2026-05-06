// Mapeo puro de error codes (de PhotoUpload/PhotoDeleteResponse) a
// mensajes de toast en español + flag triggerLogin para los casos de
// sesión expirada. Pure functions: testeables sin React, switches
// exhaustivos para que TS rompa build si se añade un código nuevo.

import type {
  PhotoDeleteResponse,
  PhotoUploadResponse,
} from "@/lib/api/photos.types";

export type UploadFailureCode = Extract<
  PhotoUploadResponse,
  { ok: false }
>["error"];

export type DeleteFailureCode = Extract<
  PhotoDeleteResponse,
  { ok: false }
>["error"];

export type FailureToast = {
  message: string;
  triggerLogin: boolean;
};

export function uploadFailureToToast(code: UploadFailureCode): FailureToast {
  switch (code) {
    case "invalid_mime":
      return { message: "Solo JPG, PNG, HEIC o WEBP", triggerLogin: false };
    case "file_too_large":
      return { message: "Máx 10 MB por foto", triggerLogin: false };
    case "unauthenticated":
      return {
        message: "Sesión expirada. Volvemos al login.",
        triggerLogin: true,
      };
    case "storage_failed":
    case "db_failed":
      return {
        message: "Error al subir. Intenta de nuevo.",
        triggerLogin: false,
      };
    case "invalid_position":
    case "invalid_body":
    case "no_file":
      return {
        message: "Algo salió mal. Refresca la página.",
        triggerLogin: false,
      };
  }
}

export function deleteFailureToToast(code: DeleteFailureCode): FailureToast {
  switch (code) {
    case "unauthenticated":
      return {
        message: "Sesión expirada. Volvemos al login.",
        triggerLogin: true,
      };
    case "storage_failed":
    case "db_failed":
      return {
        message: "Error al borrar. Intenta de nuevo.",
        triggerLogin: false,
      };
    case "invalid_position":
    case "invalid_body":
      return {
        message: "Algo salió mal. Refresca la página.",
        triggerLogin: false,
      };
  }
}
