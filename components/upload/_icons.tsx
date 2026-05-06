// SVGs literales del slide-3 (instrucciones de fotos) de V1, más dos
// utilitarios mínimos (CheckIcon, CloseIcon) para los estados "cargada"
// y "borrar". Single-use — sólo los consumen PhotoSlot y PhotoUploader;
// no exportar fuera de components/upload/. El prefijo _ marca módulo
// interno.

export function SlotSelfieIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <ellipse cx="16" cy="9" rx="3.5" ry="6" fill="#C4724A" />
      <ellipse
        cx="16"
        cy="9"
        rx="3.5"
        ry="6"
        fill="#9B7FA6"
        transform="rotate(60 16 16)"
      />
      <ellipse
        cx="16"
        cy="9"
        rx="3.5"
        ry="6"
        fill="#9B7FA6"
        transform="rotate(120 16 16)"
      />
      <ellipse
        cx="16"
        cy="9"
        rx="3.5"
        ry="6"
        fill="#D4A574"
        transform="rotate(180 16 16)"
      />
      <ellipse
        cx="16"
        cy="9"
        rx="3.5"
        ry="6"
        fill="#B8736A"
        transform="rotate(240 16 16)"
      />
      <ellipse
        cx="16"
        cy="9"
        rx="3.5"
        ry="6"
        fill="#C49090"
        transform="rotate(300 16 16)"
      />
    </svg>
  );
}

export function SlotLookIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="4.5"
        stroke="#D4967A"
        strokeWidth="0.9"
        fill="rgba(212,150,122,0.12)"
      />
      <circle
        cx="22"
        cy="10"
        r="4.5"
        stroke="#C4847E"
        strokeWidth="0.9"
        fill="rgba(196,132,126,0.1)"
      />
      <line
        x1="13.5"
        y1="13"
        x2="24"
        y2="26"
        stroke="#D4A574"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="18.5"
        y1="13"
        x2="8"
        y2="26"
        stroke="#C4847E"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SlotLuzIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect
        x="14.5"
        y="3"
        width="3"
        height="14"
        rx="1.5"
        fill="rgba(212,150,122,0.2)"
        stroke="#D4967A"
        strokeWidth="0.7"
      />
      <path d="M12 17 Q16 15 20 17 L21 24 Q16 27 11 24 Z" fill="#C4847E" />
      <path
        d="M12.5 17.5 Q16 16 19.5 17.5"
        stroke="rgba(253,240,232,0.25)"
        strokeWidth="0.5"
        fill="none"
      />
      <ellipse cx="16" cy="24" rx="4" ry="2" fill="#9B7FA6" />
    </svg>
  );
}

export function SlotMomentoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <polygon
        points="16,3 26,12 16,29 6,12"
        fill="rgba(212,165,116,0.1)"
        stroke="#D4A574"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon
        points="16,3 26,12 16,16 6,12"
        fill="rgba(196,132,126,0.2)"
        stroke="#C4847E"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <line
        x1="6"
        y1="12"
        x2="26"
        y2="12"
        stroke="rgba(212,165,116,0.4)"
        strokeWidth="0.5"
      />
      <line
        x1="16"
        y1="3"
        x2="16"
        y2="16"
        stroke="rgba(212,165,116,0.3)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function UploadHintIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="rgba(196,114,74,0.35)"
        strokeWidth="0.8"
      />
      <circle cx="7" cy="10" r="2.5" fill="rgba(196,114,74,0.35)" />
      <circle cx="17" cy="10" r="2" fill="rgba(212,148,90,0.3)" />
      <circle cx="12" cy="16" r="2.2" fill="rgba(168,90,56,0.3)" />
    </svg>
  );
}

export function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 6.5 L5 9 L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3 L9 9 M9 3 L3 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Mapping de PhotoPosition → ícono. Centraliza la asociación slot↔SVG
// en un solo punto para que PhotoSlot no haga el switch.

import type { PhotoPosition } from "@/lib/storage/photos.config";

export const SLOT_ICONS: Record<PhotoPosition, () => React.JSX.Element> = {
  1: SlotSelfieIcon,
  2: SlotLookIcon,
  3: SlotLuzIcon,
  4: SlotMomentoIcon,
};
