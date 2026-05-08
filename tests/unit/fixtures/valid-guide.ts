// Fixture canónico para tests de guide-schema y colorimetry-tool.
// Representa una guía válida para una usuaria True Spring Fitzpatrick II.
// Datos consistentes con SEASONS_DATABASE.true_spring (lipstick, blush,
// jewelry) y MUNSELL_BY_FITZPATRICK[2] (5YR 7/4, L≈72).

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
      { hex: "#FFBE8C", nombre: "melocotón luminoso", usage: "blusas, vestidos formales" },
      { hex: "#FF7F5C", nombre: "coral cálido", usage: "labial, accesorios" },
      { hex: "#C8E08C", nombre: "verde manzana", usage: "tops casuales, sweaters" },
      { hex: "#F4DEB3", nombre: "crema dorada", usage: "neutros base, capas" },
      { hex: "#F8E59B", nombre: "amarillo claro", usage: "verano, eventos diurnos" },
      { hex: "#E8785A", nombre: "melocotón intenso", usage: "labial principal, foco" },
    ],
    avoid: ["negro puro", "gris frío", "azul marino", "burdeos oscuro"],
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
