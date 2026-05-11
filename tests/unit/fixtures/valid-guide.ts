// Fixture canónico para tests de guide-schema, guide-components y
// analysis-service. Representa una guía válida para una usuaria True
// Spring Fitzpatrick II. Consistente con:
//  - SEASONS_DATABASE.true_spring (12 irradian, makeupPalettes completas)
//  - MUNSELL_BY_FITZPATRICK[2] (5YR 7/4, L≈72)
//
// G.6.B — refactor completo al shape nuevo:
//  - palette.colors (6 fijos) → palette.hero (6) + palette.extended (8-15)
//  - palette.avoid expandida a 8 entries (era 5)
//  - makeup.{lipstick,blush} → makeup.{narrative, categories(5)} con
//    counts canónicos (lipstick:5, blush:3, eyeshadow:6, eyeliner:3,
//    foundation:3) y hex literales del KB makeupPalettes
//  - occasions promovido a top-level del Guide (6 items fijos)
//  - PaletteColorSchema.occasions ahora REQUIRED

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
    hero: [
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
    // G.6.B.1 hotfix — extended INCLUYE los hex de hero (overlap intencional)
    // más complementarios. El render PaletaGrid filtra los duplicados.
    extended: [
      // Hero overlap (6 primeros = los 6 hex del hero):
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
      // Complementarios (no en hero):
      {
        hex: "#A8D870",
        nombre: "Verde primavera",
        usage: "vestidos veraniegos",
        occasions: ["diario", "casual"],
      },
      {
        hex: "#FFD060",
        nombre: "Amarillo mantequilla",
        usage: "tops cálidos",
        occasions: ["diario"],
      },
      {
        hex: "#FF8C70",
        nombre: "Salmón vivo",
        usage: "blusas statement",
        occasions: ["evento", "noche"],
      },
      {
        hex: "#88C898",
        nombre: "Verde menta cálido",
        usage: "tops frescos",
        occasions: ["casual"],
      },
    ],
    avoid: [
      { hex: "#000000", nombre: "Negro absoluto" },
      { hex: "#808898", nombre: "Gris frío" },
      { hex: "#14243B", nombre: "Azul marino" },
      { hex: "#5C0F18", nombre: "Burdeos oscuro" },
      { hex: "#FFFFFF", nombre: "Blanco frío" },
      { hex: "#D9C8A8", nombre: "Beige apagado" },
      { hex: "#6B7C45", nombre: "Verde oliva" },
      { hex: "#FF6020", nombre: "Naranja saturado" },
    ],
  },
  occasions: [
    {
      id: "diario",
      label: "Día a día",
      description:
        "Tus neutros cálidos para la rutina, donde la luz cumple sola sin pedir foco.",
      colors: ["#F5E6C8", "#FFE680", "#FFC080", "#E8B870"],
    },
    {
      id: "trabajo",
      label: "Trabajo",
      description:
        "Estructura cálida pero contenida: ningún color domina, todos sostienen.",
      colors: ["#F5E6C8", "#E8B870", "#FFC080", "#FFD060"],
    },
    {
      id: "noche",
      label: "Noche",
      description:
        "Los focos saturados: coral, salmón vivo y durazno con peso editorial.",
      colors: ["#FF7F5C", "#FF8C70", "#FFA060", "#E85838"],
    },
    {
      id: "formal",
      label: "Formal",
      description:
        "Tu luz más arquitectónica para ocasiones donde la presencia se construye.",
      colors: ["#FFBE8C", "#F5E6C8", "#E8B870", "#FFC080"],
    },
    {
      id: "casual",
      label: "Casual",
      description:
        "Frescura sin esfuerzo: verdes y amarillos que respiran sin pedir nada.",
      colors: ["#C8E08C", "#A8D870", "#88C898", "#FFE680"],
    },
    {
      id: "evento",
      label: "Evento",
      description:
        "Saturación con intención: cuando el momento pide que tu paleta hable.",
      colors: ["#FF7F5C", "#FFA060", "#FF6040", "#E85838"],
    },
  ],
  makeup: {
    narrative:
      "Tu maquillaje vive en el filo del durazno y el dorado: nunca apagado, nunca frío. Cada producto se elige para multiplicar la luz cálida que tu piel ya tiene, sin imponerse sobre ella. La paleta completa funciona en capas suaves; los productos se eligen por su afinidad con tu undertone, no por moda.",
    categories: [
      {
        category: "lipstick",
        label: "Labios",
        rationale:
          "Tu boca pide tonos cálidos y luminosos. Estos cinco labiales cubren desde el día más sutil hasta la noche con más foco — todos comparten la temperatura cálida que tu piel devuelve con luz.",
        colors: [
          { hex: "#E8785A", nombre: "Melocotón vivo" },
          { hex: "#FF7F5C", nombre: "Coral cálido" },
          { hex: "#FF6040", nombre: "Coral mandarina" },
          { hex: "#E85838", nombre: "Salmón intenso" },
          { hex: "#F08060", nombre: "Durazno luminoso" },
        ],
      },
      {
        category: "blush",
        label: "Rubor",
        rationale:
          "Tres rubores en el espectro del coral y el melocotón: el que se aplica con la mano abierta para luz natural, el medio para días con más presencia, el más pigmentado para noche.",
        colors: [
          { hex: "#FFB49A", nombre: "Coral suave" },
          { hex: "#FF9878", nombre: "Melocotón rosado" },
          { hex: "#F0A088", nombre: "Albaricoque" },
        ],
      },
      {
        category: "eyeshadow",
        label: "Sombras",
        rationale:
          "Seis sombras de tu paleta: dorados, bronces cálidos, verde menta y caramelo. Las claras como base, intermedias para ojo cotidiano, profundas para definición.",
        colors: [
          { hex: "#F5E6C8", nombre: "Crema dorada" },
          { hex: "#E8B870", nombre: "Miel clara" },
          { hex: "#C49060", nombre: "Bronce cálido" },
          { hex: "#88C898", nombre: "Verde menta cálido" },
          { hex: "#FFC080", nombre: "Albaricoque luminoso" },
          { hex: "#A87850", nombre: "Caramelo dorado" },
        ],
      },
      {
        category: "eyeliner",
        label: "Delineador",
        rationale:
          "Tres delineadores cálidos — marrones y bronces, nunca negro frío. El espresso para días, el cálido intenso para ojo definido, el bronce para statement.",
        colors: [
          { hex: "#5C3820", nombre: "Marrón cálido" },
          { hex: "#3C2820", nombre: "Café espresso cálido" },
          { hex: "#88683C", nombre: "Bronce profundo" },
        ],
      },
      {
        category: "foundation",
        label: "Base",
        rationale:
          "Tres niveles dentro del Fitzpatrick II con tu undertone cálido. Identificá tu nivel (claro, medio u oscuro) y buscá una base comercial que matchee ese undertone.",
        colors: [
          { hex: "#F8D8B8", nombre: "Marfil cálido (claro)" },
          { hex: "#E8C098", nombre: "Beige melocotón (medio)" },
          { hex: "#D8A878", nombre: "Beige dorado (oscuro)" },
        ],
      },
    ],
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
  // G.7.2 — campo top-level renombrado de `rationale` a `narrative_voice`.
  // Las 3 rationales nested (jewelry.rationale, haircut.rationale,
  // makeup.categories[].rationale) siguen como antes.
  narrative_voice:
    "Tu paleta vive en el filo entre el durazno y el dorado: una luz que llevas cuando todo lo demás guarda silencio. Los colores que irradian en tu piel comparten una claridad cálida — nunca apagada, nunca fría. Cada hex en esta guía fue elegido para multiplicar esa luz, no para imponerse sobre ella. El oro amarillo es tu metal. El melocotón #E8785A es tu labial ancla. La paleta de seis se usa en capas, sin miedo: vos sos la que da el tono.",
};
