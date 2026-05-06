"use client";

import { signInWithGoogle } from "@/lib/auth/client";
import { Logo } from "@/components/brand/Logo";
import {
  CorteIcon,
  GoogleIcon,
  MaquillajeIcon,
  MetalIcon,
  PaletaIcon,
  ShieldIcon,
} from "./_icons";

// LoginScreen — replica visual del S1 (gancho) de V1.
// Estructura, textos, SVGs y dimensiones se conservan tal cual.
// Tokens V1 (var(--marfil), var(--terra), etc) se traducen a tokens
// Tailwind del Bloque B. El símbolo ✦ se sustituye por el logo oficial PNG.

type Card = {
  Icon: () => React.JSX.Element;
  title: string;
  copy: string;
};

const CARDS: readonly Card[] = [
  { Icon: PaletaIcon, title: "Tu paleta", copy: "6 colores exactamente tuyos" },
  { Icon: CorteIcon, title: "Tu corte", copy: "El que enmarca tu geometría" },
  {
    Icon: MaquillajeIcon,
    title: "Maquillaje",
    copy: "Labial, rubor, sombras exactas",
  },
  { Icon: MetalIcon, title: "Tu metal", copy: "Cuál multiplica tu luz" },
];

export function LoginScreen() {
  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-6 py-12 box-border mx-auto">
        {/* Logo + wordmark */}
        <div className="text-center mb-5">
          <Logo size={90} className="mx-auto mb-3" />
          <div className="font-cormorant italic font-light text-[28px] text-marfil leading-[1.1]">
            Diosa
            <br />
            Interior
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center mb-7">
          <div className="font-raleway text-[15px] font-normal text-marfil/90 leading-[1.5] max-w-[340px] mx-auto">
            La primera guía de colorimetría diseñada
            <br />
            para piel latina
          </div>
        </div>

        {/* 4 cards 2x2 */}
        <div className="grid grid-cols-2 gap-2.5 mb-7">
          {CARDS.map(({ Icon, title, copy }) => (
            <div
              key={title}
              className="bg-marfil/[0.06] border-[0.5px] border-marfil/10 rounded-[3px] py-[9px] px-2 text-left"
            >
              <Icon />
              <div className="font-cormorant italic font-light text-[19px] text-marfil">
                {title}
              </div>
              <div className="font-raleway text-[13px] font-normal text-marfil/90 mt-[3px] leading-[1.4]">
                {copy}
              </div>
            </div>
          ))}
        </div>

        {/* Botón Google */}
        <div className="w-full mb-2.5 flex justify-center">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-1/2 px-4 py-2.5 flex flex-row items-center justify-center gap-2.5 rounded bg-white text-[#1a1a1a] border-0 shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
          >
            <GoogleIcon />
            <div
              className="flex flex-col items-start gap-[2px]"
              style={{ fontFamily: '"Helvetica Neue", sans-serif' }}
            >
              <div className="text-[9px] text-[#444] tracking-[0.3px] font-medium">
                Iniciar sesión
              </div>
              <div className="text-[7px] text-[#999] tracking-[0.8px] uppercase">
                con Google
              </div>
            </div>
          </button>
        </div>

        {/* Mensaje de seguridad */}
        <div className="flex items-center justify-center gap-[7px] mb-5">
          <ShieldIcon />
          <span className="font-raleway text-[13px] font-normal text-marfil/90">
            Google protege toda tu información · Sitio seguro
          </span>
        </div>
      </div>
    </main>
  );
}
