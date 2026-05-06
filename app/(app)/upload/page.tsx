// Server component de /upload.
//
// 1) requireUser() — sin sesión redirige a /login.
// 2) Carga las fotos previamente subidas por la usuaria (si las hay) y
//    genera signed URLs en paralelo para cada thumbnail. El bucket
//    "photos" es privado, así que un <img src="/storage/..."> no
//    funciona — las URLs firmadas son la única forma de servir.
// 3) Renderiza <PhotoUploader />, que vive como client component y
//    maneja todo el estado interactivo (slots, fetch, toast, etc).
//
// SignOutButton vive ahora dentro de PhotoUploader; la página solo
// orquesta data fetching.

import { PhotoUploader } from "@/components/upload/PhotoUploader";
import { requireUser } from "@/lib/auth/server";
import { getSignedPhotoUrl, getUserPhotos } from "@/lib/storage/photos";

export const metadata = {
  title: "Sube tus fotos — Diosa Interior",
};

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const user = await requireUser();
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
