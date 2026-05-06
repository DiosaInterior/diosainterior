import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireUser } from "@/lib/auth/server";

export const metadata = {
  title: "Sube tus fotos — Diosa Interior",
};

// Placeholder provisional. El uploader real (4 fotos + URLs firmadas
// vía Supabase Storage) llega en Bloque D. Los textos editoriales son
// neutros porque la voz definitiva se decide al construir la pantalla.

function getFirstName(user: User): string {
  const meta: Record<string, unknown> = user.user_metadata ?? {};
  for (const key of ["given_name", "first_name", "full_name", "name"]) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().split(/\s+/)[0];
    }
  }
  if (user.email) {
    return user.email.split("@")[0];
  }
  return "Diosa";
}

export default async function UploadPage() {
  const user = await requireUser();
  const firstName = getFirstName(user);

  return (
    <main className="dark-radial min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-dvh flex flex-col justify-center px-6 py-12 box-border mx-auto text-center">
        <Logo size={90} className="mx-auto mb-8" />

        <h1 className="font-cormorant italic font-light text-marfil text-[32px] leading-[1.1]">
          Bienvenida {firstName}
        </h1>

        <p className="font-raleway text-[15px] font-normal text-marfil/85 mt-6 leading-[1.5] max-w-[340px] mx-auto">
          Aquí subirás tus 4 fotos en el siguiente paso.
        </p>

        <div className="mt-16">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
