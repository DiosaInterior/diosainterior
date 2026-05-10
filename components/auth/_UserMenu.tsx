"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/client";

type Props = {
  firstName: string;
  avatarUrl: string | undefined;
  email: string;
};

export function UserMenu({ firstName, avatarUrl, email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  const initials = firstName.slice(0, 1).toUpperCase() || "·";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de cuenta"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 hover:opacity-90 transition-opacity min-h-[44px] px-2"
      >
        <span className="hidden lg:inline font-cormorant italic text-marfil text-base">
          {firstName}
        </span>

        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-vino-medio border border-terra-diosa/30">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center font-dm-mono text-marfil text-sm">
              {initials}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-lg dark-radial border border-marfil/10 shadow-xl backdrop-blur-md py-2"
        >
          <div className="px-4 py-3 border-b border-marfil/8">
            <p className="font-cormorant italic text-marfil text-base leading-tight">
              {firstName}
            </p>
            <p className="font-dm-mono text-marfil-suave/60 text-[11px] mt-1 truncate">
              {email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            className="w-full text-left px-4 py-3 font-raleway text-sm text-marfil-suave/80 hover:text-terra-2 hover:bg-vino-medio/30 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
