// =====================================================================
// Diosa Interior — Meta Pixel base script
// =====================================================================
// G.7 — inyecta el snippet base de fbq en <body> y dispara PageView
// automático en cada page load. Carga via next/script con strategy
// 'afterInteractive' para no bloquear el render inicial.
//
// El componente es server-side (renderiza el <script> directamente).
// Si NEXT_PUBLIC_META_PIXEL_ID no está definido (dev local), no
// renderiza nada — todo el sistema queda no-op por defecto.
//
// PageView automático: el snippet base de Meta llama
// fbq('init', PIXEL_ID) seguido de fbq('track', 'PageView') al cargar.
// Eso cubre todas las routes sin necesidad de useEffect por página.
// =====================================================================

import Script from "next/script";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixelScript() {
  if (!PIXEL_ID) return null;

  return (
    <Script
      id="meta-pixel-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`,
      }}
    />
  );
}
