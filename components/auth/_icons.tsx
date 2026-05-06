// SVGs inline copiados literalmente del S1 (gancho) de V1.
// Single-use — sólo los consume LoginScreen.tsx; no exportar fuera de
// components/auth/. El prefijo _ marca el módulo como interno.

export function PaletaIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      className="mb-[5px] block"
      aria-hidden="true"
    >
      <circle cx="10" cy="11" r="3.5" fill="#C4724A" />
      <circle cx="22" cy="11" r="3.5" fill="#9B6B47" />
      <circle cx="10" cy="22" r="3.5" fill="#D4A574" />
      <circle cx="22" cy="22" r="3.5" fill="#8B5A3C" />
    </svg>
  );
}

export function CorteIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      className="mb-[5px] block"
      aria-hidden="true"
    >
      <ellipse
        cx="16"
        cy="14"
        rx="9"
        ry="11"
        fill="rgba(196,114,74,0.15)"
        stroke="#C4724A"
        strokeWidth="0.8"
      />
      <path
        d="M7 12 Q12 5 16 6 Q20 5 25 12"
        stroke="#C4724A"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export function MaquillajeIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      className="mb-[5px] block"
      aria-hidden="true"
    >
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

export function MetalIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      className="mb-[5px] block"
      aria-hidden="true"
    >
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

export function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg
      width="11"
      height="13"
      viewBox="0 0 11 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.5 0L0.5 2.5V6C0.5 9 2.7 11.7 5.5 12.5C8.3 11.7 10.5 9 10.5 6V2.5L5.5 0Z"
        fill="rgba(196,114,74,0.2)"
        stroke="rgba(196,114,74,0.5)"
        strokeWidth="0.6"
      />
      <path
        d="M3.5 7L5 8.5L7.5 5"
        stroke="rgba(196,114,74,0.9)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
