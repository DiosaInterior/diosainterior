"use client";

// Botón centrado que abre el AddToHomeModal. Vive al final del scroll
// de /mi-guia (antes del footer). Estado open/close local; el modal es
// un sibling controlado vía props.

import { useState } from "react";

import { AddToHomeModal } from "./AddToHomeModal";

function SmartphoneIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function AddToHomeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center mt-16 mb-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-3 font-raleway font-light text-sm uppercase tracking-[0.2em] text-terra-diosa hover:text-terra-2 transition-colors min-h-[44px] px-2"
        >
          <SmartphoneIcon />
          <span>Guardar en mi pantalla de inicio</span>
        </button>
      </div>
      <AddToHomeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
