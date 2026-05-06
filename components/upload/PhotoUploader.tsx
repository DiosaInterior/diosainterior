"use client";

// PhotoUploader — orquestador del flow /upload.
//
// Responsabilidades:
//  - Hidrata estado de los 4 slots desde initialPhotos (server fetch).
//  - Compone <UploadHeader> + grid de <PhotoSlot> + <UploadCTA> + <Toast>.
//  - Delega upload/delete a useSlotMutations (fetch + setState + toast)
//    para mantener el componente bajo el límite de 200 líneas.
//
// Layout: dark-radial column max-w-[420px], igual que LoginScreen.

import { useState } from "react";
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
import { useSlotMutations, type SlotState } from "./useSlotMutations";

type Props = {
  initialPhotos: Array<{ photo: Photo; signedUrl: string | null }>;
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

export function PhotoUploader({ initialPhotos }: Props) {
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

  const uploadedCount = Object.values(slots).filter(
    (s) => s.photo !== null,
  ).length;
  const allReady = uploadedCount === 4;

  function handleContinue() {
    if (!allReady) return;
    toast("Próximamente, paso siguiente: pago seguro con Stripe ✦");
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
        />
      </div>

      <Toast message={message} />
    </main>
  );
}
