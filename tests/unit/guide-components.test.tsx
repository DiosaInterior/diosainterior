import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { EvitarList } from "@/components/guide/EvitarList";
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
