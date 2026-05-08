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
    expect(typeof colorimetryTool.description).toBe("string");
    expect(colorimetryTool.description.length).toBeGreaterThan(40);
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

  it("input_schema tiene las properties top-level esperadas (scientific, palette, makeup, jewelry, haircut, rationale)", () => {
    const schema = colorimetryTool.input_schema as {
      properties?: Record<string, unknown>;
    };
    expect(schema.properties).toBeDefined();
    const keys = Object.keys(schema.properties ?? {});
    expect(keys).toEqual(
      expect.arrayContaining([
        "scientific",
        "palette",
        "makeup",
        "jewelry",
        "haircut",
        "rationale",
      ]),
    );
  });
});
