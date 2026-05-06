"use client";

// Un slot individual del PhotoUploader. Tres estados visuales:
//   1) vacío: ícono del slot + label + sublabel + badge + CTA "ELEGIR →"
//   2) lleno con signedUrl: <img> del thumbnail + ✓ Cargada + botón ✕
//   3) lleno sin signedUrl: ícono del slot semi-transparente + ✓ Cargada
//      + botón ✕ (UX defensiva si la firma falla)
// Mientras uploading, el contenido se atenúa y aparece un spinner.

import { useRef } from "react";
import Image from "next/image";

import type {
  Photo,
  PhotoSlot as PhotoSlotType,
} from "@/lib/storage/photos.config";

import { CheckIcon, CloseIcon, SLOT_ICONS } from "./_icons";

const ACCEPT_MIME = "image/jpeg,image/png,image/heic,image/webp";

function isHeic(photo: Photo): boolean {
  return photo.storage_path.toLowerCase().endsWith(".heic");
}

type Props = {
  slot: PhotoSlotType;
  photo: Photo | null;
  signedUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export function PhotoSlot({
  slot,
  photo,
  signedUrl,
  uploading,
  onUpload,
  onDelete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (uploading) return;
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset el input para que seleccionar el mismo archivo de nuevo
    // dispare onChange (sin esto el browser deduplica).
    event.target.value = "";
    if (file) onUpload(file);
  }

  const Icon = SLOT_ICONS[slot.position];
  const filled = photo !== null;
  // Chrome/Firefox no renderizan HEIC nativamente; la foto se subió y
  // firmó OK pero el <img> del thumbnail aparece roto. Detect por
  // extensión del storage_path y cae a FilledFallback con copy editorial.
  // Trade-off: Safari sí soporta HEIC pero igual mostrará el placeholder
  // — preferimos UX uniforme cross-browser sobre UA-sniff. Cuando Bloque
  // F normalice HEIC→JPEG server-side con sharp, este branch puede irse.
  const photoIsHeic = photo !== null && isHeic(photo);
  const showThumb = filled && signedUrl !== null && !photoIsHeic;

  return (
    <div
      className={`relative flex flex-col items-stretch
        bg-marfil/[0.06] rounded-[3px] py-[14px] px-[10px]
        min-h-[110px] text-center transition-colors
        border-[0.5px] ${filled ? "border-emerald-700/45" : "border-marfil/10"}
        ${uploading ? "opacity-70" : ""}`}
    >
      {/* Botón ✕ visible sólo cuando hay foto */}
      {filled && (
        <button
          type="button"
          onClick={onDelete}
          disabled={uploading}
          aria-label={`Eliminar ${slot.label}`}
          className="absolute top-1.5 right-1.5 z-10
            w-6 h-6 flex items-center justify-center rounded-full
            bg-vino-profundo/70 text-marfil
            hover:bg-vino-profundo/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CloseIcon size={10} />
        </button>
      )}

      {/* Spinner mientras se sube */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="w-5 h-5 rounded-full border-[1.5px] border-marfil/30 border-t-marfil/80 animate-spin" />
        </div>
      )}

      {showThumb && signedUrl ? (
        <FilledThumb signedUrl={signedUrl} label={slot.label} />
      ) : filled ? (
        <FilledFallback Icon={Icon} />
      ) : (
        <EmptyState slot={slot} Icon={Icon} />
      )}

      {/* CTA + estado al pie */}
      {filled ? (
        <div className="mt-2 flex items-center justify-center gap-1 font-dm-mono uppercase text-[8px] tracking-[1.5px] text-emerald-500/85">
          <CheckIcon size={10} />
          <span>Cargada</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="mt-2 font-dm-mono uppercase text-[8px] tracking-[1.5px]
            text-terra-diosa hover:text-terra-2 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Elegir →
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIME}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Sub-renders
// ---------------------------------------------------------------------

function EmptyState({
  slot,
  Icon,
}: {
  slot: PhotoSlotType;
  Icon: () => React.JSX.Element;
}) {
  return (
    <>
      {/* Badge superior: "01 · CLAVE" o "02"/"03"/"04" */}
      <div className="mb-1 font-dm-mono uppercase text-[7px] tracking-[1.5px]">
        {slot.badge === "clave" ? (
          <span className="text-terra-diosa">
            {String(slot.position).padStart(2, "0")} · CLAVE
          </span>
        ) : (
          <span className="text-marfil/40">
            {String(slot.position).padStart(2, "0")}
          </span>
        )}
      </div>

      <div
        className={`mx-auto mb-1 ${slot.badge === "clave" ? "" : "opacity-65"}`}
      >
        <Icon />
      </div>

      <div className="font-cormorant italic font-light text-[16px] text-marfil leading-[1.15]">
        {slot.label}
      </div>
      <div className="mt-1 font-raleway text-[11px] text-marfil/65 leading-[1.35]">
        {slot.sublabel}
      </div>
    </>
  );
}

function FilledThumb({
  signedUrl,
  label,
}: {
  signedUrl: string;
  label: string;
}) {
  return (
    <div className="relative w-full aspect-square rounded-[2px] overflow-hidden">
      <Image
        src={signedUrl}
        alt={label}
        fill
        sizes="(max-width: 420px) 50vw, 200px"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

function FilledFallback({ Icon }: { Icon: () => React.JSX.Element }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1 px-1">
      <div className="opacity-30">
        <Icon />
      </div>
      <p className="font-cormorant italic text-[14px] text-marfil/85 leading-[1.1]">
        Foto guardada
      </p>
      <p className="font-dm-mono uppercase text-[7px] tracking-[1px] text-marfil/40 leading-[1.3] text-center">
        Vista previa no disponible
      </p>
    </div>
  );
}
