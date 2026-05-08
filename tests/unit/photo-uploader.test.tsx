import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Mock useRouter para evitar errores de contexto durante SSR del
// client component. fetch se mockea defensivo aunque el render
// estático no debería dispararlo (no hay useEffect/IO al mount).
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

globalThis.fetch = vi.fn();

import { PhotoUploader } from "@/components/upload/PhotoUploader";
import { UploadCTA } from "@/components/upload/UploadCTA";
import type { Photo, PhotoPosition } from "@/lib/storage/photos";

function fakePhoto(position: PhotoPosition): Photo {
  return {
    id: `id-${position}`,
    user_id: "user-1",
    position,
    storage_path: `user-1/${position}.jpg`,
    uploaded_at: "2026-05-06T00:00:00Z",
  };
}

function render(initial: Array<{ photo: Photo; signedUrl: string | null }>) {
  return renderToStaticMarkup(<PhotoUploader initialPhotos={initial} />);
}

describe("PhotoUploader — header canónico V1", () => {
  it("renderiza eyebrow + h1 + subhead", () => {
    const html = render([]);
    expect(html).toContain("Tu análisis · paso 1 de 2");
    expect(html).toContain("Elige 4 fotos");
    expect(html).toContain("de tu galería");
    // React colapsa los saltos de línea + indent del JSX a un solo espacio
    // en el output renderizado.
    expect(html).toContain(
      "No necesitas tomar nada ahora. Usa fotos que ya tienes — en distintos lugares donde te sientas bella.",
    );
  });

  it("renderiza el mini-card educativo", () => {
    const html = render([]);
    expect(html).toContain("Por qué nuestro análisis es superior");
    expect(html).toContain("Cada foto tiene luz diferente");
  });
});

describe("PhotoUploader — los 4 slots", () => {
  it("renderiza los 4 labels canónicos del slide-3 V1", () => {
    const html = render([]);
    expect(html).toContain("Selfie de rostro");
    expect(html).toContain("Look completo");
    expect(html).toContain("Luz diferente");
    expect(html).toContain("Tu momento favorita");
  });

  it("renderiza los 4 sublabels canónicos del slide-3 V1", () => {
    const html = render([]);
    expect(html).toContain("Sin filtro · cualquier lugar");
    expect(html).toContain("De cabeza a pies · ropa que te gusta");
    expect(html).toContain("Restaurante, exterior, oficina");
    expect(html).toContain("Evento, viaje — donde más te gustaste");
  });

  it("badge 'CLAVE' aparece sólo en posición 1", () => {
    const html = render([]);
    expect(html).toContain("01 · CLAVE");
    expect(html).toContain("02");
    expect(html).toContain("03");
    expect(html).toContain("04");
  });
});

describe("PhotoUploader — hint dinámico y CTA", () => {
  it("con 0 fotos: hint eyebrow + botón deshabilitado", () => {
    const html = render([]);
    expect(html).toContain("ELIGE LAS 4 FOTOS PARA CONTINUAR");
    // Marcadores únicos del estado disabled del CTA Continuar:
    //  - clase `bg-marfil/15 text-marfil/40` (sólo en UploadCTA disabled)
    //  - texto `text-vino-profundo` AUSENTE (es del CTA habilitado)
    expect(html).toContain("bg-marfil/15 text-marfil/40");
    expect(html).not.toContain("text-vino-profundo");
  });

  it("con 2 fotos: hint plural 'FALTAN 2 FOTOS'", () => {
    const html = render([
      { photo: fakePhoto(1), signedUrl: "https://x/1" },
      { photo: fakePhoto(2), signedUrl: "https://x/2" },
    ]);
    expect(html).toContain("FALTAN 2 FOTOS");
    expect(html).toContain("bg-marfil/15 text-marfil/40");
  });

  it("con 3 fotos: hint singular 'FALTA 1 FOTO'", () => {
    const html = render([
      { photo: fakePhoto(1), signedUrl: "https://x/1" },
      { photo: fakePhoto(2), signedUrl: "https://x/2" },
      { photo: fakePhoto(3), signedUrl: "https://x/3" },
    ]);
    expect(html).toContain("FALTA 1 FOTO");
  });

  it("con 4 fotos: hint celebratorio editorial + botón habilitado", () => {
    const html = render([1, 2, 3, 4].map((p) => ({
      photo: fakePhoto(p as PhotoPosition),
      signedUrl: `https://x/${p}`,
    })));
    expect(html).toContain("¡Listas! Toca para continuar ✦");
    // Typography swap: estado completo usa Cormorant italic + terra
    expect(html).toContain("font-cormorant italic");
    // CTA habilitado: tiene `text-vino-profundo` (clase única) y NO la
    // clase disabled del CTA. (cursor-not-allowed sigue presente como
    // utility de estado en los botones de PhotoSlot — no es marcador.)
    expect(html).toContain("text-vino-profundo");
    expect(html).not.toContain("bg-marfil/15 text-marfil/40");
  });
});

describe("PhotoUploader — estado 'Cargada'", () => {
  it("slot lleno muestra ✓ Cargada en lugar de 'Elegir →'", () => {
    const html = render([
      { photo: fakePhoto(1), signedUrl: "https://x/1" },
    ]);
    expect(html).toContain("Cargada");
  });

  it("photo .jpg con signedUrl renderiza img normal", () => {
    const html = render([{ photo: fakePhoto(1), signedUrl: "https://x/1" }]);
    // Tras F.0.2 (HEIC normalization server-side), no existe placeholder
    // editorial específico para HEIC — el bucket guarda solo JPEG/PNG/WEBP.
    expect(html).not.toContain("Vista previa no disponible");
    expect(html).not.toContain("Foto guardada");
  });
});

// ---------------------------------------------------------------------
// UploadCTA — checkoutLoading
// ---------------------------------------------------------------------
// Tests directos al sub-componente porque el state checkoutLoading vive
// dentro de useCheckout (interno a PhotoUploader) y no se puede setear
// desde fuera. Pasamos la prop directo a UploadCTA y verificamos la UI.

describe("UploadCTA — checkoutLoading", () => {
  it("4 fotos + checkoutLoading=false: botón habilitado, texto 'Continuar →'", () => {
    const html = renderToStaticMarkup(
      <UploadCTA
        uploadedCount={4}
        onContinue={() => {}}
        checkoutLoading={false}
      />,
    );
    expect(html).toContain("Continuar →");
    expect(html).not.toContain("Procesando");
    // Disabled state class ausente (botón habilitado)
    expect(html).not.toContain("bg-marfil/15 text-marfil/40");
  });

  it("4 fotos + checkoutLoading=true: botón disabled, texto 'Procesando...'", () => {
    const html = renderToStaticMarkup(
      <UploadCTA
        uploadedCount={4}
        onContinue={() => {}}
        checkoutLoading={true}
      />,
    );
    expect(html).toContain("Procesando...");
    expect(html).not.toContain("Continuar →");
    // Disabled durante checkout incluso con allReady
    expect(html).toContain("bg-marfil/15 text-marfil/40");
  });

  it("<4 fotos + checkoutLoading=false: deshabilitado por allReady=false, texto 'Continuar →'", () => {
    const html = renderToStaticMarkup(
      <UploadCTA
        uploadedCount={2}
        onContinue={() => {}}
        checkoutLoading={false}
      />,
    );
    expect(html).toContain("Continuar →");
    expect(html).toContain("bg-marfil/15 text-marfil/40");
  });
});
