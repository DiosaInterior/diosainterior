// Server component de /mi-guia — placeholder G.1.
//
// Lee la guide más reciente del user logueado y renderiza un esqueleto
// mínimo que confirma data shape + integración. G.2 reemplaza el
// contenido con componentes visuales finales (PaletteGrid, MakeupCard,
// JewelryRow, HaircutPanel, RationaleProse, etc).
//
// Sin params: lee la guide más reciente del user. La PK natural es
// (user_id, created_at) y el flow del MVP es 1 guide por compra. Si
// en el futuro hay re-análisis o multi-guide, /mi-guia/[id] se
// agregará en otro bloque.

import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { requireUser } from "@/lib/auth/server";
import { getLatestGuideForUser } from "@/lib/db/guides";

export const metadata = {
  title: "Mi guía — Diosa Interior",
};

export default async function MiGuiaPage() {
  const user = await requireUser();
  const guide = await getLatestGuideForUser(user.id);

  if (!guide) {
    redirect("/upload");
  }

  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[640px] min-h-dvh flex flex-col px-8 py-12 box-border mx-auto">
        <Logo size={70} className="mx-auto mb-10" />

        <h1 className="font-cormorant italic font-light text-marfil text-[40px] leading-[1.05] tracking-tight text-center">
          Tu guía.
        </h1>

        <p className="font-raleway text-[15px] text-marfil/85 mt-8 leading-[1.6] text-center">
          {guide.scientific.season.replace(/_/g, " ")} · Fitzpatrick{" "}
          {guide.scientific.fitzpatrick}
        </p>

        <div className="mt-12 grid grid-cols-3 gap-3">
          {guide.palette.colors.map((color) => (
            <div key={color.hex} className="flex flex-col items-center">
              <div
                className="w-full aspect-square rounded-sm"
                style={{ backgroundColor: color.hex }}
                aria-label={color.nombre}
              />
              <p className="font-dm-mono text-[10px] text-marfil/65 mt-2 uppercase tracking-wider">
                {color.hex}
              </p>
              <p className="font-raleway text-[11px] text-marfil/85 mt-1 text-center">
                {color.nombre}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-[480px] mx-auto">
          <p className="font-raleway text-[15px] text-marfil/85 leading-[1.6] italic">
            {guide.rationale}
          </p>
        </div>

        <p className="font-dm-mono uppercase text-[9px] tracking-[0.4em] text-marfil/40 mt-16 text-center">
          G.2 — COMPONENTES VISUALES PENDIENTES
        </p>
      </div>
    </main>
  );
}
