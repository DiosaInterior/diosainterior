// Fixture canónico para tests de guide-schema y colorimetry-tool.
// Representa una guía válida para una usuaria True Spring Fitzpatrick II.
// Datos consistentes con SEASONS_DATABASE.true_spring (lipstick, blush,
// jewelry, hex irradian) y MUNSELL_BY_FITZPATRICK[2] (5YR 7/4, L≈72).
//
// G.6.A — actualizaciones:
//  - palette.avoid migra de string[] a AvoidColor[{hex, nombre}].
//  - Los 6 hex de palette.colors usan hex canónicos del KB expandido
//    (algunos cambiaron de version vs G.6.0: crema dorada
//    #F4DEB3 → #F5E6C8, amarillo claro #F8E59B → #FFE680).
//  - El 6to color cambia de "melocotón intenso" (#E8785A — invent
//    legacy) a "Durazno cálido" (#FFA060 — canónico del KB).

import type { Guide } from "@/lib/validation/guide-schema";

export const validGuide: Guide = {
  scientific: {
    fitzpatrick: 2,
    season: "true_spring",
    undertone: "warm_golden",
    hue: "warm",
    value: "light",
    chroma: "clear",
    munsell_notation: "5YR 7/4",
    cie_lab: { L: 72, a: 12, b: 20 },
    contrast_level: "medium",
  },
  palette: {
    colors: [
      {
        hex: "#FFBE8C",
        nombre: "Melocotón luminoso",
        usage: "blusas, vestidos formales",
        occasions: ["formal", "diario", "evento"],
      },
      {
        hex: "#FF7F5C",
        nombre: "Coral cálido",
        usage: "labial, accesorios",
        occasions: ["evento", "noche"],
      },
      {
        hex: "#C8E08C",
        nombre: "Verde manzana",
        usage: "tops casuales, sweaters",
        occasions: ["diario", "casual"],
      },
      {
        hex: "#F5E6C8",
        nombre: "Crema dorada",
        usage: "neutros base, capas",
        occasions: ["diario", "trabajo"],
      },
      {
        hex: "#FFE680",
        nombre: "Amarillo claro",
        usage: "verano, eventos diurnos",
        occasions: ["diario", "evento"],
      },
      {
        hex: "#FFA060",
        nombre: "Durazno cálido",
        usage: "labial principal, foco",
        occasions: ["evento", "noche"],
      },
    ],
    avoid: [
      { hex: "#000000", nombre: "Negro absoluto" },
      { hex: "#808898", nombre: "Gris frío" },
      { hex: "#14243B", nombre: "Azul marino" },
      { hex: "#5C0F18", nombre: "Burdeos oscuro" },
      { hex: "#FFFFFF", nombre: "Blanco frío" },
    ],
  },
  makeup: {
    lipstick: { name: "melocotón", hex: "#E8785A" },
    blush: { name: "coral suave", hex: "#FFB49A" },
  },
  jewelry: {
    type: "gold_yellow",
    rationale:
      "El oro amarillo amplifica los undertones dorados de tu piel y enmarca el rostro con calidez sin competir.",
  },
  haircut: {
    description: "Capas largas con movimiento desde la mandíbula, fleco lateral suave.",
    rationale:
      "El movimiento abre los pómulos y refuerza la luminosidad cálida característica de tu estación.",
  },
  rationale:
    "Tu paleta vive en el filo entre el durazno y el dorado: una luz que llevas cuando todo lo demás guarda silencio. Los colores que irradian en tu piel comparten una claridad cálida — nunca apagada, nunca fría. Cada hex en esta guía fue elegido para multiplicar esa luz, no para imponerse sobre ella. El oro amarillo es tu metal. El melocotón #E8785A es tu labial ancla. La paleta de seis se usa en capas, sin miedo: vos sos la que da el tono.",
};
