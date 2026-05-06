// Sub-componente extraído de PhotoUploader. Contiene el hint dinámico
// (con typography swap según uploadedCount) y el botón Continuar +
// SignOutButton al pie. Sin state interno: recibe uploadedCount y
// onContinue del padre.

import { SignOutButton } from "@/components/auth/SignOutButton";

type Props = {
  uploadedCount: number;
  onContinue: () => void;
};

export function UploadCTA({ uploadedCount, onContinue }: Props) {
  const allReady = uploadedCount === 4;
  const hint = computeHint(uploadedCount);

  // Typography swap: estados incompletos en mono uppercase tracking
  // (estilo técnico/eyebrow); estado completo en Cormorant italic
  // terra (voz editorial celebratoria).
  const hintClass = allReady
    ? "font-cormorant italic text-[15px] text-terra-diosa"
    : "font-dm-mono uppercase text-[7px] tracking-[1.5px] text-marfil/40";

  const buttonClass = allReady
    ? "bg-terra-diosa text-vino-profundo shadow-[0_4px_16px_rgba(196,114,74,0.25)] hover:bg-terra-2"
    : "bg-marfil/15 text-marfil/40 cursor-not-allowed";

  return (
    <>
      <p className={`text-center mb-4 ${hintClass}`}>{hint}</p>

      <button
        type="button"
        onClick={onContinue}
        disabled={!allReady}
        className={`w-full py-3.5 rounded-[3px] font-raleway uppercase text-[12px] tracking-[0.3em] transition-colors ${buttonClass}`}
      >
        Continuar →
      </button>

      <div className="mt-12 text-center">
        <SignOutButton />
      </div>
    </>
  );
}

function computeHint(uploadedCount: number): string {
  if (uploadedCount === 0) return "ELIGE LAS 4 FOTOS PARA CONTINUAR";
  if (uploadedCount === 4) return "¡Listas! Toca para continuar ✦";
  const remaining = 4 - uploadedCount;
  if (remaining === 1) return "FALTA 1 FOTO";
  return `FALTAN ${remaining} FOTOS`;
}
