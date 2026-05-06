// Sub-componente extraído de PhotoUploader para mantener al principal
// bajo el límite de 200 líneas. Contiene el header del flow (eyebrow +
// h1 + subhead) y el mini-card educativo "POR QUÉ NUESTRO ANÁLISIS ES
// SUPERIOR" — todo estático, sin state ni interactividad.

import { UploadHintIcon } from "./_icons";

export function UploadHeader() {
  return (
    <>
      <header className="text-center mb-7">
        <p className="font-dm-mono uppercase text-[10px] tracking-[0.4em] text-terra-diosa/85 mb-3">
          Tu análisis · paso 1 de 2
        </p>
        <h1 className="font-cormorant italic font-light text-marfil text-[34px] leading-[1.05] tracking-tight">
          Elige 4 fotos
          <br />
          de tu galería
        </h1>
        <p className="font-cormorant italic text-marfil-suave/65 text-[18px] leading-[1.4] mt-4">
          No necesitas tomar nada ahora. Usa fotos que ya tienes — en distintos
          lugares donde te sientas bella.
        </p>
      </header>

      <div className="mb-7 px-4 py-3 rounded-[3px] bg-marfil/[0.04] border-[0.5px] border-marfil/10 flex items-center gap-3">
        <UploadHintIcon />
        <div className="text-left">
          <p className="font-dm-mono uppercase text-[8px] tracking-[1.5px] text-terra-diosa/85">
            Por qué nuestro análisis es superior
          </p>
          <p className="font-cormorant italic text-marfil text-[15px] leading-[1.3] mt-0.5">
            Cada foto tiene luz diferente
          </p>
        </div>
      </div>
    </>
  );
}
