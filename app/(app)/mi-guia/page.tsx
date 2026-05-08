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
import { EvitarList } from "@/components/guide/EvitarList";
import { PaletaGrid } from "@/components/guide/PaletaGrid";
import { PerfilCard } from "@/components/guide/PerfilCard";
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
    <main className="dark-radial min-h-screen">
      <div className="mx-auto max-w-[640px] px-8 py-12">
        <div className="flex justify-center mb-12">
          <Logo size={48} />
        </div>

        <PerfilCard guide={guide} />

        <div className="mt-20">
          <PaletaGrid colors={guide.palette.colors} />
        </div>

        <div className="mt-20">
          <EvitarList avoid={guide.palette.avoid ?? []} />
        </div>

        <p className="mt-24 text-center font-dm-mono text-xs uppercase tracking-widest text-marfil-suave/40">
          G.2.2.B — ocasiones, maquillaje, joyería, corte pendientes
        </p>
      </div>
    </main>
  );
}
