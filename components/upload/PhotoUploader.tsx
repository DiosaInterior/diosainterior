"use client";

// PhotoUploader — orquestador del flow /upload.
//
// Responsabilidades:
//  - Hidrata estado de los 4 slots desde initialPhotos (server fetch).
//  - Compone <UploadHeader> + grid de <PhotoSlot> + <UploadCTA> + <Toast>.
//  - Delega upload/delete a useSlotMutations y checkout a useCheckout
//    para mantener el componente bajo el límite de 200 líneas.
//  - initialToast (opcional): mensaje que se muestra al mount (ej.
//    cuando la usuaria vuelve de Stripe con ?canceled=1).
//
// Layout: dark-radial column max-w-[420px], igual que LoginScreen.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Toast, useToast } from "@/components/ui/Toast";
import {
  PHOTO_SLOTS,
  type Photo,
  type PhotoPosition,
} from "@/lib/storage/photos.config";

import { PhotoSlot } from "./PhotoSlot";
import { UploadCTA } from "./UploadCTA";
import { UploadHeader } from "./UploadHeader";
import { useCheckout } from "./useCheckout";
import { useSlotMutations, type SlotState } from "./useSlotMutations";

type Props = {
  initialPhotos: Array<{ photo: Photo; signedUrl: string | null }>;
  initialToast?: string;
};

const EMPTY_SLOTS: Record<PhotoPosition, SlotState> = {
  1: { photo: null, signedUrl: null, uploading: false },
  2: { photo: null, signedUrl: null, uploading: false },
  3: { photo: null, signedUrl: null, uploading: false },
  4: { photo: null, signedUrl: null, uploading: false },
};

function buildInitialSlots(
  initial: Props["initialPhotos"],
): Record<PhotoPosition, SlotState> {
  const slots: Record<PhotoPosition, SlotState> = { ...EMPTY_SLOTS };
  for (const init of initial) {
    const pos = init.photo.position;
    if (pos < 1 || pos > 4) continue;
    slots[pos as PhotoPosition] = {
      photo: init.photo,
      signedUrl: init.signedUrl,
      uploading: false,
    };
  }
  return slots;
}

export function PhotoUploader({ initialPhotos, initialToast }: Props) {
  const router = useRouter();
  const { toast, message } = useToast();
  const [slots, setSlots] = useState<Record<PhotoPosition, SlotState>>(() =>
    buildInitialSlots(initialPhotos),
  );
  const { handleUpload, handleDelete } = useSlotMutations({
    setSlots,
    toast,
    router,
  });
  const { handleCheckout, checkoutLoading } = useCheckout({ toast, router });

  // Muestra initialToast una sola vez al mount. Ref evita que cambios
  // posteriores en initialToast (poco probables en práctica) re-disparen.
  const initialToastShownRef = useRef(false);
  useEffect(() => {
    if (initialToast && !initialToastShownRef.current) {
      initialToastShownRef.current = true;
      toast(initialToast);
    }
  }, [initialToast, toast]);

  const uploadedCount = Object.values(slots).filter(
    (s) => s.photo !== null,
  ).length;
  const allReady = uploadedCount === 4;

  function handleContinue() {
    if (!allReady) return;
    void handleCheckout();
  }

  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] mx-auto pt-[72px] px-8 pb-14 box-border">
        <UploadHeader />

        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {PHOTO_SLOTS.map((slot) => {
            const state = slots[slot.position];
            return (
              <PhotoSlot
                key={slot.position}
                slot={slot}
                photo={state.photo}
                signedUrl={state.signedUrl}
                uploading={state.uploading}
                onUpload={(file) => handleUpload(slot.position, file)}
                onDelete={() => handleDelete(slot.position)}
              />
            );
          })}
        </div>

        <UploadCTA
          uploadedCount={uploadedCount}
          onContinue={handleContinue}
          checkoutLoading={checkoutLoading}
        />
      </div>

      <Toast message={message} />
    </main>
  );
}
