"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Toast minimal: hook + componente. State local en el caller (usa
// useToast donde lo necesite). Sin Provider/Context — si más adelante
// hace falta toast desde múltiples componentes, refactorizamos.
//
// Animación: fade-in opacity 0 → 1 (300ms) al montar. Sin fade-out — al
// dismiss el componente se desmonta directamente (suficientemente
// editorial sin la complejidad de un doble timeout).

const DEFAULT_DURATION_MS = 3500;

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback(
    (msg: string, durationMs: number = DEFAULT_DURATION_MS) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    [],
  );

  // Limpia el timer si el caller se desmonta antes del dismiss para
  // evitar setMessage en componente desmontado.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, message };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  // key={message}: cada nuevo mensaje remonta el inner para que el
  // fade-in se replay incluso si el toast llega encadenado.
  return <ToastInner key={message} message={message} />;
}

function ToastInner({ message }: { message: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // requestAnimationFrame asegura que la primera pintura tiene
    // opacity-0 y la siguiente transiciona a opacity-100.
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="status"
      className={`fixed bottom-7 left-1/2 -translate-x-1/2 z-[999]
        bg-vino-medio border border-vino-suave text-marfil
        font-raleway text-[15px] py-2.5 px-[22px] rounded-[3px]
        shadow-[0_8px_24px_rgba(0,0,0,0.4)]
        transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {message}
    </div>
  );
}
