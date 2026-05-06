import { describe, it, expect } from "vitest";
import {
  createPurchaseSchema,
  createPhotoSchema,
  createBookingSchema,
  guideSchema,
  paletaItemSchema,
  type GuideData,
} from "@/lib/validation/schemas";

// =====================================================================
// PURCHASE
// =====================================================================
describe("createPurchaseSchema", () => {
  it("acepta input válido con currency default", () => {
    const result = createPurchaseSchema.parse({
      product: "base",
      amountCents: 99900,
    });
    expect(result.product).toBe("base");
    expect(result.currency).toBe("mxn");
  });

  it("rechaza product fuera del enum", () => {
    expect(() =>
      createPurchaseSchema.parse({ product: "premium", amountCents: 100 }),
    ).toThrow();
  });

  it("rechaza amountCents negativo o cero", () => {
    expect(() =>
      createPurchaseSchema.parse({ product: "base", amountCents: 0 }),
    ).toThrow();
    expect(() =>
      createPurchaseSchema.parse({ product: "base", amountCents: -100 }),
    ).toThrow();
  });

  it("rechaza currency con longitud distinta de 3", () => {
    expect(() =>
      createPurchaseSchema.parse({
        product: "wedding",
        amountCents: 100,
        currency: "pesos",
      }),
    ).toThrow();
  });
});

// =====================================================================
// PHOTO
// =====================================================================
describe("createPhotoSchema", () => {
  it("acepta position en el rango 1-4", () => {
    for (const position of [1, 2, 3, 4]) {
      expect(() =>
        createPhotoSchema.parse({ storagePath: "users/x/p.jpg", position }),
      ).not.toThrow();
    }
  });

  it("rechaza position fuera de rango", () => {
    expect(() =>
      createPhotoSchema.parse({ storagePath: "x", position: 0 }),
    ).toThrow();
    expect(() =>
      createPhotoSchema.parse({ storagePath: "x", position: 5 }),
    ).toThrow();
  });

  it("rechaza storagePath vacío", () => {
    expect(() =>
      createPhotoSchema.parse({ storagePath: "", position: 1 }),
    ).toThrow();
  });
});

// =====================================================================
// BOOKING
// =====================================================================
describe("createBookingSchema", () => {
  it("acepta input mínimo (solo name + email)", () => {
    const result = createBookingSchema.parse({
      name: "María",
      email: "maria@example.com",
    });
    expect(result.email).toBe("maria@example.com");
    expect(result.phone).toBeUndefined();
  });

  it("rechaza email inválido", () => {
    expect(() =>
      createBookingSchema.parse({ name: "x", email: "no-es-email" }),
    ).toThrow();
  });

  it("rechaza preferredDate con formato no ISO", () => {
    expect(() =>
      createBookingSchema.parse({
        name: "x",
        email: "x@y.com",
        preferredDate: "01/05/2026",
      }),
    ).toThrow();
  });

  it("acepta preferredDate ISO válida", () => {
    const result = createBookingSchema.parse({
      name: "x",
      email: "x@y.com",
      preferredDate: "2026-05-15",
    });
    expect(result.preferredDate).toBe("2026-05-15");
  });
});

// =====================================================================
// HEX color validation (vía paletaItemSchema)
// =====================================================================
describe("hex color validation", () => {
  const baseItem = {
    nombre: "Terracota",
    desc: "Calidez profunda",
    tip: "Combina con tonos tierra",
  };

  it("acepta hex de 6 dígitos con #", () => {
    expect(() =>
      paletaItemSchema.parse({ ...baseItem, hex: "#A0522D" }),
    ).not.toThrow();
    expect(() =>
      paletaItemSchema.parse({ ...baseItem, hex: "#abcdef" }),
    ).not.toThrow();
  });

  it("rechaza hex sin #", () => {
    expect(() =>
      paletaItemSchema.parse({ ...baseItem, hex: "A0522D" }),
    ).toThrow();
  });

  it("rechaza hex de 3 dígitos", () => {
    expect(() =>
      paletaItemSchema.parse({ ...baseItem, hex: "#FFF" }),
    ).toThrow();
  });

  it("rechaza hex con caracteres no hex", () => {
    expect(() =>
      paletaItemSchema.parse({ ...baseItem, hex: "#GGGGGG" }),
    ).toThrow();
  });
});

// =====================================================================
// GUIDE (top-level) — contrato estricto con Anthropic
// =====================================================================
describe("guideSchema", () => {
  it("acepta una guía completa válida", () => {
    expect(() => guideSchema.parse(makeValidGuide())).not.toThrow();
  });

  it("rechaza paleta con menos de 6 items", () => {
    const guide = makeValidGuide();
    guide.paleta = guide.paleta.slice(0, 5) as GuideData["paleta"];
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("rechaza paleta con más de 6 items", () => {
    const guide = makeValidGuide();
    guide.paleta = [...guide.paleta, guide.paleta[0]] as GuideData["paleta"];
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("rechaza ocasiones con cantidad distinta de 6", () => {
    const guide = makeValidGuide();
    guide.ocasiones = guide.ocasiones.slice(0, 5) as GuideData["ocasiones"];
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("rechaza zonas de maquillaje con cantidad distinta de 5", () => {
    const guide = makeValidGuide();
    guide.maquillaje.zonas = guide.maquillaje.zonas.slice(
      0,
      4,
    ) as GuideData["maquillaje"]["zonas"];
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("rechaza perfil.pills con cantidad distinta de 5", () => {
    const guide = makeValidGuide();
    guide.perfil.pills = ["solo", "tres", "pills"];
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("rechaza corte.si con cantidad distinta de 5", () => {
    const guide = makeValidGuide();
    guide.corte.si = ["uno", "dos"];
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("rechaza un hex inválido en cualquier paleta", () => {
    const guide = makeValidGuide();
    guide.paleta[0].hex = "no-es-hex";
    expect(() => guideSchema.parse(guide)).toThrow();
  });

  it("acepta gradient CSS arbitrario en metal.*.color", () => {
    const guide = makeValidGuide();
    guide.metal.ideal.color = "linear-gradient(135deg, #FFD700, #B8860B)";
    expect(() => guideSchema.parse(guide)).not.toThrow();
  });
});

// =====================================================================
// Fixture
// =====================================================================
function makeValidGuide(): GuideData {
  return {
    perfil: {
      tipo: "Otoño Cálido Profundo",
      pills: ["Cálido", "Profundo", "Apagado", "Otoño", "Latina"],
      narrativa: "Tu piel tiene undertone cálido profundo con velo dorado.",
    },
    paleta: Array.from({ length: 6 }, (_, i) => ({
      nombre: `Color ${i + 1}`,
      hex: "#A0522D",
      desc: "Calidez profunda",
      tip: "Combina con tonos tierra",
    })) as GuideData["paleta"],
    evitar: Array.from({ length: 5 }, (_, i) => ({
      color: "#FFFFFF",
      nombre: `Evitar ${i + 1}`,
    })) as GuideData["evitar"],
    ocasiones: Array.from({ length: 6 }, (_, i) => ({
      emoji: "🌅",
      nombre: `Ocasión ${i + 1}`,
      tag: "casual",
      colores: ["#A0522D", "#B8860B", "#8B4513", "#CD853F", "#D2691E"],
      nombres: "Terracota, Mostaza, Cobre, Camel, Chocolate",
    })) as GuideData["ocasiones"],
    corte: {
      geometria: "Oval suave",
      narrativa: "Cortes que abrazan tu rostro.",
      si: ["Long bob", "Capas suaves", "Flecos cortina", "Layered shag", "Lob ondulado"],
      no: ["Pixie ultra corto", "Bob recto extremo", "Frente recto duro"],
    },
    maquillaje: {
      narrativa: "Tonos tierra y dorados.",
      zonas: Array.from({ length: 5 }, (_, i) => ({
        zona: `Zona ${i + 1}`,
        colores: ["#A0522D", "#B8860B", "#8B4513"],
        valor: "Tonos cálidos profundos",
        marcas: "MAC\nMaybelline\nL'Oréal",
        full: false,
      })) as GuideData["maquillaje"]["zonas"],
    },
    metal: {
      narrativa: "Metales cálidos te iluminan.",
      ideal: {
        nombre: "Oro amarillo",
        color: "linear-gradient(135deg, #FFD700, #B8860B)",
        label: "Ideal",
        sub: "Para todos los días",
      },
      secundario: {
        nombre: "Cobre",
        color: "linear-gradient(135deg, #B87333, #8B4513)",
        label: "Secundario",
      },
      evitar: {
        nombre: "Plata",
        color: "linear-gradient(135deg, #C0C0C0, #808080)",
        label: "Evitar",
      },
    },
  };
}
