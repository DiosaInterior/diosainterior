import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { CorteCard } from "@/components/guide/CorteCard";
import { EvitarList } from "@/components/guide/EvitarList";
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
    const color = validGuide.palette.colors[0];
    const html = renderHTML(<PaletaSwatch color={color} />);

    expect(html.toLowerCase()).toContain(color.hex.toLowerCase());
    expect(html).toContain(color.nombre);
    expect(html).toContain(color.usage);
  });
});

describe("PaletaGrid", () => {
  it("renderiza los 6 hex codes de la paleta", () => {
    const html = renderHTML(
      <PaletaGrid colors={validGuide.palette.colors} />,
    );

    for (const color of validGuide.palette.colors) {
      expect(html.toLowerCase()).toContain(color.hex.toLowerCase());
    }
  });
});

describe("EvitarList", () => {
  it("con avoid populado renderiza los items", () => {
    const html = renderHTML(<EvitarList avoid={validGuide.palette.avoid} />);

    expect(html).toContain(validGuide.palette.avoid[0]);
  });

  it("con avoid vacío renderiza null (HTML vacío)", () => {
    const html = renderHTML(<EvitarList avoid={[]} />);

    expect(html).toBe("");
  });
});

describe("OcasionesGrid", () => {
  it("con colors poblados con occasions renderiza los display labels", () => {
    const html = renderHTML(
      <OcasionesGrid colors={validGuide.palette.colors} />,
    );

    // El fixture cubre los 6 valores de OccasionEnum.
    expect(html).toContain("Día a día");
    expect(html).toContain("Trabajo");
    expect(html).toContain("Noche");
    expect(html).toContain("Formal");
    expect(html).toContain("Casual");
    expect(html).toContain("Evento");
  });

  it("con colors sin occasions (todos undefined) renderiza null", () => {
    const stripped = validGuide.palette.colors.map((c) => ({
      hex: c.hex,
      nombre: c.nombre,
      usage: c.usage,
    }));
    const html = renderHTML(<OcasionesGrid colors={stripped} />);

    expect(html).toBe("");
  });
});

describe("MaquillajeCard", () => {
  it("con makeup completo renderiza LABIAL, RUBOR, ambos hex y nombres", () => {
    const html = renderHTML(<MaquillajeCard makeup={validGuide.makeup} />);

    expect(html).toContain("LABIAL");
    expect(html).toContain("RUBOR");
    expect(html).toContain(validGuide.makeup.lipstick.name);
    expect(html.toLowerCase()).toContain(
      validGuide.makeup.lipstick.hex.toLowerCase(),
    );
    expect(html).toContain(validGuide.makeup.blush!.name);
    expect(html.toLowerCase()).toContain(
      validGuide.makeup.blush!.hex.toLowerCase(),
    );
  });

  it("con makeup sin blush renderiza LABIAL pero NO RUBOR", () => {
    const html = renderHTML(
      <MaquillajeCard makeup={{ lipstick: validGuide.makeup.lipstick }} />,
    );

    expect(html).toContain("LABIAL");
    expect(html).not.toContain("RUBOR");
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
