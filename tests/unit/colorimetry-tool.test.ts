import { describe, expect, it } from "vitest";

import {
  COLORIMETRY_TOOL_NAME,
  colorimetryTool,
} from "@/lib/ai/tools/colorimetry-tool";

describe("colorimetryTool — Anthropic tool definition", () => {
  it("name es 'submit_colorimetric_analysis'", () => {
    expect(COLORIMETRY_TOOL_NAME).toBe("submit_colorimetric_analysis");
    expect(colorimetryTool.name).toBe("submit_colorimetric_analysis");
  });

  it("description tiene contenido (no string vacío)", () => {
    expect(colorimetryTool.description).toBeTruthy();
    expect(colorimetryTool.description).toMatch(/.{40,}/);
  });

  it("input_schema.type === 'object'", () => {
    const schema = colorimetryTool.input_schema as { type?: string };
    expect(schema.type).toBe("object");
  });

  it("input_schema NO tiene $ref en ninguna profundidad ($refStrategy: 'none')", () => {
    // Anthropic no resuelve $ref. Stringify-search confirma cero ocurrencias.
    const serialized = JSON.stringify(colorimetryTool.input_schema);
    expect(serialized).not.toContain('"$ref"');
    expect(serialized).not.toContain("definitions");
  });

  it("input_schema tiene las properties top-level esperadas (scientific, palette, occasions, makeup, jewelry, haircut, narrative_voice)", () => {
    const schema = colorimetryTool.input_schema as {
      properties?: Record<string, unknown>;
    };
    expect(schema.properties).toBeDefined();
    const keys = Object.keys(schema.properties ?? {});
    // G.7.2 — `rationale` top-level renombrado a `narrative_voice`.
    // Los rationales nested (jewelry.rationale, haircut.rationale,
    // makeup.categories[].rationale) NO aparecen como properties
    // top-level del GuideSchema — viven dentro de sus respectivos
    // sub-schemas. La lista de abajo cubre solo los top-level.
    expect(keys).toEqual(
      expect.arrayContaining([
        "scientific",
        "palette",
        "occasions",
        "makeup",
        "jewelry",
        "haircut",
        "narrative_voice",
      ]),
    );
  });

  // G.7.2 — el bug original (jobs G.7.1 fallando con
  // `rationale missing`) sugería que la IA podía omitir el campo.
  // Para descartar que `z.toJSONSchema` no marcara el campo como
  // required (hipótesis B del diagnóstico), validamos el array
  // `required` explícitamente.
  it("input_schema.required incluye narrative_voice y los demás top-level críticos", () => {
    const schema = colorimetryTool.input_schema as {
      required?: string[];
    };
    expect(schema.required).toBeDefined();
    expect(schema.required).toEqual(
      expect.arrayContaining([
        "scientific",
        "palette",
        "occasions",
        "makeup",
        "jewelry",
        "haircut",
        "narrative_voice",
      ]),
    );
  });

  it("input_schema NO contiene la palabra 'rationale' como property top-level (renombrada en G.7.2)", () => {
    const schema = colorimetryTool.input_schema as {
      properties?: Record<string, unknown>;
    };
    expect(Object.keys(schema.properties ?? {})).not.toContain("rationale");
  });
});
