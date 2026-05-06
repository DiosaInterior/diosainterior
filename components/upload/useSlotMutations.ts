"use client";

// Custom hook que expone handleUpload(position, file) y handleDelete(position)
// para PhotoUploader. Encapsula el flow fetch → parse → setSlots →
// toast errores tipados, evitando que PhotoUploader sobrepase el
// límite de 200 líneas.
//
// La política de errores vive en _errors.ts (funciones puras); la
// política de "redirect a login si sesión expiró" se canaliza acá vía
// el flag triggerLogin que retorna el mapping.

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import type {
  PhotoDeleteResponse,
  PhotoUploadResponse,
} from "@/lib/api/photos.types";
import type { Photo, PhotoPosition } from "@/lib/storage/photos.config";

import { deleteFailureToToast, uploadFailureToToast } from "./_errors";

export type SlotState = {
  photo: Photo | null;
  signedUrl: string | null;
  uploading: boolean;
};

type SlotsRecord = Record<PhotoPosition, SlotState>;

type Router = ReturnType<typeof useRouter>;

type Opts = {
  setSlots: Dispatch<SetStateAction<SlotsRecord>>;
  toast: (msg: string) => void;
  router: Router;
};

const REDIRECT_DELAY_MS = 800;

export function useSlotMutations({ setSlots, toast, router }: Opts) {
  const handleUpload = useCallback(
    async (position: PhotoPosition, file: File) => {
      setSlots((s) => ({
        ...s,
        [position]: { ...s[position], uploading: true },
      }));

      const fd = new FormData();
      fd.append("file", file);
      fd.append("position", String(position));

      let body: PhotoUploadResponse;
      try {
        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: fd,
        });
        body = (await res.json()) as PhotoUploadResponse;
      } catch {
        setSlots((s) => ({
          ...s,
          [position]: { ...s[position], uploading: false },
        }));
        toast("Error de red. Revisa tu conexión.");
        return;
      }

      if (!body.ok) {
        setSlots((s) => ({
          ...s,
          [position]: { ...s[position], uploading: false },
        }));
        const { message, triggerLogin } = uploadFailureToToast(body.error);
        toast(message);
        if (triggerLogin) {
          setTimeout(() => router.push("/login"), REDIRECT_DELAY_MS);
        }
        return;
      }

      setSlots((s) => ({
        ...s,
        [position]: {
          photo: body.photo,
          signedUrl: body.signedUrl,
          uploading: false,
        },
      }));
    },
    [setSlots, toast, router],
  );

  const handleDelete = useCallback(
    async (position: PhotoPosition) => {
      setSlots((s) => ({
        ...s,
        [position]: { ...s[position], uploading: true },
      }));

      let body: PhotoDeleteResponse;
      try {
        const res = await fetch("/api/photos/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position }),
        });
        body = (await res.json()) as PhotoDeleteResponse;
      } catch {
        setSlots((s) => ({
          ...s,
          [position]: { ...s[position], uploading: false },
        }));
        toast("Error de red. Revisa tu conexión.");
        return;
      }

      if (!body.ok) {
        setSlots((s) => ({
          ...s,
          [position]: { ...s[position], uploading: false },
        }));
        const { message, triggerLogin } = deleteFailureToToast(body.error);
        toast(message);
        if (triggerLogin) {
          setTimeout(() => router.push("/login"), REDIRECT_DELAY_MS);
        }
        return;
      }

      setSlots((s) => ({
        ...s,
        [position]: { photo: null, signedUrl: null, uploading: false },
      }));
    },
    [setSlots, toast, router],
  );

  return { handleUpload, handleDelete };
}
