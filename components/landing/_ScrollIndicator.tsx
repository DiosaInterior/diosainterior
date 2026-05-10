// Indicador visual de scroll para hero mobile.
// Texto pequeño "Más info" + flecha animada hacia abajo.
// Anima con bounce vertical suave (CSS-only, sin Motion library).
// Solo aparece en mobile — desktop tiene scroll natural visible.

export function ScrollIndicator() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col items-center gap-2 animate-bounce-soft"
    >
      <span className="font-dm-mono text-[11px] tracking-[0.3em] uppercase text-marfil-suave/70">
        Más info
      </span>
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-marfil-suave/80"
      >
        <path
          d="M10 4 L10 20 M4 14 L10 20 L16 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
