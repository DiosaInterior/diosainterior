// Server component de /upload.
//
// 1) requireUser() — sin sesión redirige a /login.
// 2) G.4.2 guard — si la usuaria ya tiene guía, redirect a /mi-guia.
//    Cubre los caminos a /upload que NO pasan por el callback OAuth
//    (URL manual, bookmark, link compartido). G.4.3 cubre el caso
//    post-login; este guard cierra el camino post-login-ya-existente.
// 3) Carga las fotos previamente subidas por la usuaria (si las hay) y
//    genera signed URLs en paralelo para cada thumbnail. El bucket
//    "photos" es privado, así que un <img src="/storage/..."> no
//    funciona — las URLs firmadas son la única forma de servir.
// 4) Renderiza <PhotoUploader />, que vive como client component y
//    maneja todo el estado interactivo (slots, fetch, toast, etc).
//
// SignOutButton vive ahora dentro de PhotoUploader; la página solo
// orquesta data fetching.

import { redirect } from "next/navigation";

import { PhotoUploader } from "@/components/upload/PhotoUploader";
import { requireUser } from "@/lib/auth/server";
import { getLatestGuideForUser } from "@/lib/db/guides";
import { getSignedPhotoUrl, getUserPhotos } from "@/lib/storage/photos";
import type { Guide } from "@/lib/validation/guide-schema";

export const metadata = {
  title: "Sube tus fotos — Diosa Interior",
};

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const user = await requireUser();

  // Guard contra doble compra. Try/catch defensivo: si la query falla
  // (DB error, timeout), fallback a /upload — mejor permitir el flow
  // que bloquear con pantalla rota. El redirect vive FUERA del try
  // para que su excepción interna de Next.js no sea capturada por
  // accidente.
  let guide: Guide | null = null;
  try {
    guide = await getLatestGuideForUser(user.id);
  } catch (err) {
    console.error("[G.4.2] guide check failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (guide) {
    redirect("/mi-guia");
  }

  const photos = await getUserPhotos(user.id);
  const initialPhotos = await Promise.all(
    photos.map(async (photo) => ({
      photo,
      signedUrl: await getSignedPhotoUrl(photo.storage_path),
    })),
  );

  // Stripe redirige a /upload?canceled=1 cuando la usuaria cierra el
  // checkout sin pagar. Le mostramos un toast suave al volver.
  const { canceled } = await searchParams;
  const initialToast =
    canceled === "1"
      ? "Pago cancelado. Cuando estés lista, vuelve a continuar."
      : undefined;

  return (
    <PhotoUploader
      initialPhotos={initialPhotos}
      initialToast={initialToast}
    />
  );
}
