"use client";

// Modal device-aware con instrucciones para "Add to Home Screen" nativo.
// 3 ramas de render: iOS (Safari), Android (Chrome) y Desktop (mensaje
// para abrir en celular).
//
// El device se computa inline al renderizar (no en useState/useEffect)
// porque el modal solo monta cuando open=true, lo cual solo ocurre tras
// un click del usuario — siempre post-hydration, siempre client-side.
// Eso evita hydration mismatch sin necesitar el anti-pattern de
// setState dentro de useEffect.
//
// 6 íconos SVG inline (patrón del repo, no se introducen deps externas).
// Cada uno es 20×20, stroke currentColor, strokeWidth 1.5 — estilo Lucide.

import { useEffect } from "react";

import { detectDevice } from "@/lib/utils/device";

// ---------------------------------------------------------------------
// SVG ICONS (inline, sin dep externa)
// ---------------------------------------------------------------------

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function SmartphoneIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MoreVerticalIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------

function Separator() {
  return (
    <p
      aria-hidden="true"
      className="text-center text-terra-diosa text-base my-6 select-none"
    >
      ✦
    </p>
  );
}

function Step({
  number,
  icon,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="font-raleway font-light text-sm uppercase tracking-[0.15em] text-terra-diosa shrink-0 pt-1 tabular-nums">
        {number}
      </span>
      <span className="text-terra-diosa shrink-0 pt-1">{icon}</span>
      <p className="font-cormorant italic text-lg text-marfil leading-snug">
        {text}
      </p>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-cormorant italic text-[28px] text-marfil text-center leading-tight">
      {children}
    </h2>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-cormorant italic text-base text-marfil/65 text-center leading-relaxed mt-6">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------
// CONTENT BRANCHES
// ---------------------------------------------------------------------

function IOSContent() {
  return (
    <>
      <Title>Guarda tu guía en 3 pasos</Title>
      <Separator />
      <div className="flex flex-col gap-6">
        <Step
          number="1"
          icon={<ShareIcon />}
          text="Tocá el ícono de Compartir en la barra inferior de Safari"
        />
        <Step
          number="2"
          icon={<ChevronDownIcon />}
          text="Deslizá hacia abajo y tocá 'Agregar a inicio'"
        />
        <Step
          number="3"
          icon={<CheckIcon />}
          text="Tocá 'Agregar' en la esquina superior derecha"
        />
      </div>
      <Footnote>
        Tu guía aparecerá como un acceso directo en la pantalla de inicio
        de tu iPhone.
      </Footnote>
    </>
  );
}

function AndroidContent() {
  return (
    <>
      <Title>Guarda tu guía en 3 pasos</Title>
      <Separator />
      <div className="flex flex-col gap-6">
        <Step
          number="1"
          icon={<MoreVerticalIcon />}
          text="Tocá los tres puntos en la esquina superior derecha de Chrome"
        />
        <Step
          number="2"
          icon={<SmartphoneIcon />}
          text="Tocá 'Agregar a pantalla de inicio' o 'Instalar aplicación'"
        />
        <Step
          number="3"
          icon={<CheckIcon />}
          text="Confirmá tocando 'Agregar'"
        />
      </div>
      <Footnote>
        Tu guía aparecerá como un acceso directo en la pantalla de inicio
        de tu celular.
      </Footnote>
    </>
  );
}

function DesktopContent() {
  return (
    <>
      <Title>Abrí esta página desde tu celular</Title>
      <Separator />
      <p className="font-cormorant italic text-lg text-marfil/85 text-center leading-relaxed">
        En el probador, tener tu guía a mano hace la diferencia. Abrí
        diosainterior.app desde tu iPhone o Android para guardarla con un
        toque.
      </p>
    </>
  );
}

// ---------------------------------------------------------------------
// MAIN MODAL
// ---------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddToHomeModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Cómputo inline post-render. Cuando llegamos acá, open=true ⇒
  // el usuario ya clickeó ⇒ estamos client-side post-hydration.
  const device = detectDevice();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cómo guardar la guía en tu pantalla de inicio"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
        className="absolute inset-0 bg-vino-profundo/80 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-[480px] bg-vino-medio border border-terra-suave/20 rounded-lg p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-marfil/70 hover:text-marfil transition-colors min-h-[44px] min-w-[44px]"
        >
          <XIcon />
        </button>
        {device === "ios" && <IOSContent />}
        {device === "android" && <AndroidContent />}
        {device === "desktop" && <DesktopContent />}
      </div>
    </div>
  );
}
