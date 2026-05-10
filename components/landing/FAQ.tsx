"use client";

import { useState } from "react";

import { RevealOnScroll } from "./_RevealOnScroll";

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: "¿Cómo funciona realmente?",
    a: "Subes 4 fotos en luz natural. Nuestro sistema analiza tu temperatura cromática, undertone y profundidad usando los mismos sistemas científicos que usan los laboratorios de cosmética. Recibís tu paleta en menos de 5 minutos.",
  },
  {
    q: "¿Qué fotos necesito?",
    a: "Una foto de tu rostro sin maquillaje en luz natural, una de tu cabello, y dos de tu piel desnuda en zonas distintas (brazo, cuello). No necesitás cámara profesional — tu celular es suficiente.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "$499 MXN. Una sola vez. Tu paleta queda guardada en tu cuenta para siempre, sin renovaciones ni cargos ocultos.",
  },
  {
    q: "¿Funciona para todos los tipos de piel?",
    a: "Sí. Diosa Interior está calibrada con la diversidad real de undertones, profundidades y matices que existen en la piel humana — desde Fitzpatrick II hasta VI. No importa si tu piel es muy clara, media, profunda, cálida, fría u oliva.",
  },
  {
    q: "¿Y si no me convence el resultado?",
    a: "Tu paleta es definitiva — está calibrada con la ciencia exacta de tu piel, no es opinión. Si tenés dudas sobre tu análisis, escribinos a hola@diosainterior.app y revisamos tu caso.",
  },
  {
    q: "¿La paleta cambia con el tiempo?",
    a: "Tu paleta cromática base no cambia — está determinada por la arquitectura genética de tu piel. Lo que sí podés explorar son paletas para contextos específicos: bodas, quinceañeras, sesiones hiperpersonalizadas. Esas las lanzamos pronto.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="dark-radial py-24 lg:py-32 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll>
          <p className="font-dm-mono text-xs tracking-[0.4em] uppercase text-terra-diosa text-center mb-4">
            Preguntas frecuentes
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={150}>
          <h2 className="font-cormorant italic font-light text-marfil text-3xl sm:text-4xl lg:text-5xl text-center leading-tight mb-16">
            Lo que querés saber.
          </h2>
        </RevealOnScroll>

        <div className="divide-y divide-terra-diosa/15 border-y border-terra-diosa/15">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <RevealOnScroll key={item.q} delay={i * 80}>
                <div>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="w-full flex items-center justify-between gap-6 py-6 lg:py-7 text-left hover:text-terra-2 transition-colors duration-200 min-h-[44px]"
                  >
                    <span className="font-cormorant italic text-marfil text-lg lg:text-xl leading-tight">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`font-dm-mono text-terra-diosa text-2xl shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 pb-6"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="font-raleway text-marfil-suave/80 text-base leading-relaxed max-w-prose">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
