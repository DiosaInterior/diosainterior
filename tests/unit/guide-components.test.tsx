import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { CorteCard } from "@/components/guide/CorteCard";
import { EvitarGrid } from "@/components/guide/EvitarGrid";
import { MaquillajeCard } from "@/components/guide/MaquillajeCard";
import { MetalesCard } from "@/components/guide/MetalesCard";
import { OcasionesGrid } from "@/components/guide/OcasionesGrid";
import { PaletaGrid } from "@/components/guide/PaletaGrid";
import { PaletaSwatch } from "@/components/guide/PaletaSwatch";
import { PerfilCard } from "@/components/guide/PerfilCard";

import { validGuide } from "./fixtures/valid-guide";

function renderHTML(node: ReactElement): string {
  return renderToStaticMarkup(node);
}

describe("PerfilCard", () => {
  it("renderiza season en formato display, fitzpatrick, undertone, hue y rationale", () => {
    const html = renderHTML(<PerfilCard guide={validGuide} />);

    // season "true_spring" → "True Spring" (replace _ + capitalize)
    expect(html).toContain("True Spring");
    // Fitzpatrick (fixture: 2)
    expect(html).toContain(`Fitzpatrick ${validGuide.scientific.fitzpatrick}`);
    // undertone "warm_golden" → "warm golden"
    expect(html).toContain(validGuide.scientific.undertone.replace(/_/g, " "));
    // hue "warm" → "warm"
    expect(html).toContain(validGuide.scientific.hue.replace(/_/g, " "));
    // primeros chars del rationale
    expect(html).toContain(validGuide.rationale.slice(0, 50));
  });
});

describe("PaletaSwatch", () => {
  it("renderiza hex, nombre y usage del color", () => {
    const color = validGuide.palette.hero[0];
    const html = renderHTML(<PaletaSwatch color={color} />);

    expect(html.toLowerCase()).toContain(color.hex.toLowerCase());
    expect(html).toContain(color.nombre);
    expect(html).toContain(color.usage);
  });
});

describe("PaletaGrid (G.6.B — hero + extended)", () => {
  it("renderiza los 6 hex de palette.hero", () => {
    const html = renderHTML(<PaletaGrid palette={validGuide.palette} />);

    for (const color of validGuide.palette.hero) {
      expect(html.toLowerCase()).toContain(color.hex.toLowerCase());
    }
  });

  it("renderiza los hex de palette.extended cuando hay entries", () => {
    const html = renderHTML(<PaletaGrid palette={validGuide.palette} />);

    for (const color of validGuide.palette.extended) {
      expect(html.toLowerCase()).toContain(color.hex.toLowerCase());
    }
    // Y muestra el copy de la sección extended.
    expect(html).toContain("Tus matices complementarios");
  });
});

describe("EvitarGrid (G.6.B — reemplaza EvitarList)", () => {
  it("con avoid populado renderiza los hex y nombres de los colores", () => {
    const html = renderHTML(<EvitarGrid avoid={validGuide.palette.avoid} />);

    // Cada avoid item ahora tiene hex visible como background-color y
    // nombre como texto. El componente muestra ambos.
    expect(html).toContain(validGuide.palette.avoid[0].nombre);
    expect(html.toLowerCase()).toContain(
      validGuide.palette.avoid[0].hex.toLowerCase(),
    );
  });

  it("con avoid vacío renderiza null (HTML vacío)", () => {
    const html = renderHTML(<EvitarGrid avoid={[]} />);

    expect(html).toBe("");
  });
});

describe("OcasionesGrid (G.6.B — consume guide.occasions directo)", () => {
  it("renderiza los 6 labels de las 6 ocasiones canónicas", () => {
    const html = renderHTML(<OcasionesGrid occasions={validGuide.occasions} />);

    // El fixture tiene las 6 ocasiones canónicas con sus labels en español.
    for (const occ of validGuide.occasions) {
      expect(html).toContain(occ.label);
    }
  });

  it("renderiza la description de cada ocasión", () => {
    const html = renderHTML(<OcasionesGrid occasions={validGuide.occasions} />);

    for (const occ of validGuide.occasions) {
      expect(html).toContain(occ.description);
    }
  });

  it("con array vacío renderiza null", () => {
    const html = renderHTML(<OcasionesGrid occasions={[]} />);
    expect(html).toBe("");
  });
});

describe("MaquillajeCard (G.6.B — 5 categorías)", () => {
  it("renderiza la narrative global", () => {
    const html = renderHTML(<MaquillajeCard makeup={validGuide.makeup} />);

    expect(html).toContain(validGuide.makeup.narrative);
  });

  it("renderiza las 5 eyebrows de categorías (LABIOS, RUBOR, SOMBRAS, DELINEADOR, BASE)", () => {
    const html = renderHTML(<MaquillajeCard makeup={validGuide.makeup} />);

    // Los eyebrows pueden estar uppercased por la clase CSS — testeamos
    // el contenido textual literal que el componente inyecta.
    expect(html).toContain("Labios");
    expect(html).toContain("Rubor");
    expect(html).toContain("Sombras");
    expect(html).toContain("Delineador");
    expect(html).toContain("Base");
  });

  it("renderiza el rationale de cada categoría", () => {
    const html = renderHTML(<MaquillajeCard makeup={validGuide.makeup} />);

    for (const cat of validGuide.makeup.categories) {
      expect(html).toContain(cat.rationale);
    }
  });

  it("renderiza los hex de los 5 lipsticks de la categoría lipstick", () => {
    const html = renderHTML(<MaquillajeCard makeup={validGuide.makeup} />);

    const lipstickCat = validGuide.makeup.categories.find(
      (c) => c.category === "lipstick",
    );
    expect(lipstickCat).toBeDefined();
    expect(lipstickCat?.colors).toHaveLength(5);
    for (const color of lipstickCat!.colors) {
      expect(html.toLowerCase()).toContain(color.hex.toLowerCase());
    }
  });
});

describe("MetalesCard", () => {
  it("con jewelry.type=gold_yellow renderiza 'Oro amarillo' y el rationale", () => {
    const html = renderHTML(<MetalesCard jewelry={validGuide.jewelry} />);

    expect(html).toContain("Oro amarillo");
    expect(html).toContain(validGuide.jewelry.rationale);
  });
});

describe("CorteCard", () => {
  it("renderiza description y rationale", () => {
    const html = renderHTML(<CorteCard haircut={validGuide.haircut} />);

    expect(html).toContain(validGuide.haircut.description);
    expect(html).toContain(validGuide.haircut.rationale);
  });
});
