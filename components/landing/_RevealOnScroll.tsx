"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Delay en ms para escalonar varios reveals consecutivos. */
  delay?: number;
  className?: string;
};

// Wrapper minúsculo para fade-in + slide-up sutil al entrar al viewport.
// CSS-only animation (sin Motion library) — Tailwind transition + transform.
//
// Reduced-motion: respetado vía Tailwind `motion-safe:` y `motion-reduce:`.
// Usuarias con prefers-reduced-motion ven el contenido visible al instante
// (las clases hidden-state solo aplican bajo motion-safe; sin esas clases,
// opacity y translate caen al default = visible). Sin JS branch.
export function RevealOnScroll({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible
          ? "opacity-100 translate-y-0"
          : "motion-safe:opacity-0 motion-safe:translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}
