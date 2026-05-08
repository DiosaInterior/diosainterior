// =====================================================================
// Diosa Interior — Anthropic tool definition para análisis colorimétrico
// =====================================================================
// El job de análisis (Bloque F) llama a Anthropic con tool_choice forzado
// a este tool, garantizando que el modelo responda con el shape exacto
// del GuideSchema. z.toJSONSchema deriva el JSON Schema desde el Zod
// para mantener UNA sola fuente de verdad sobre la estructura.
//
// reused: "inline" — Anthropic NO resuelve $ref; el JSON Schema debe
// ser inline. Por default Zod reutiliza sub-schemas vía $ref/$defs
// (típico cuando un sub-schema aparece >1 vez); `reused: "inline"` los
// expande inline para que el modelo vea la estructura completa sin
// indirección.
//
// Por qué z.toJSONSchema (Zod 4 nativo) y NO zod-to-json-schema:
// la lib externa quedó pinned a Zod 3 (accede a symbols internos como
// _parse/_getType que cambiaron en v4). Fue deprecada en Nov 2025 a
// favor de la API nativa que adoptamos acá.
// =====================================================================

import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { GuideSchema } from "@/lib/validation/guide-schema";

export const COLORIMETRY_TOOL_NAME = "submit_colorimetric_analysis" as const;

const TOOL_DESCRIPTION = `Submits the complete colorimetric analysis for the user's photos. \
You MUST call this tool exactly once with the full guide payload. \
The analysis covers scientific profile (Fitzpatrick, season, Munsell, CIE Lab), \
6-color personal palette, makeup recommendations (lipstick, optional blush), \
jewelry metal recommendation, haircut suggestion, and a narrative rationale \
in the brand voice (intimate-expert, declarative, never coach-style).`;

const inputSchema = z.toJSONSchema(GuideSchema, {
  // Inline reused sub-schemas en lugar de extraerlos a $defs/$ref.
  // Anthropic no resuelve $ref pointers en tool input_schema.
  reused: "inline",
});

// El tipo nominal Anthropic.Messages.Tool exige input_schema.type === "object".
// z.toJSONSchema retorna un JSONSchema7 cuyo `type` es una unión amplia, así
// que tipamos el cast en el assignment (no hay riesgo: GuideSchema es un
// z.object → siempre genera type:"object" en runtime).
export const colorimetryTool: Anthropic.Messages.Tool = {
  name: COLORIMETRY_TOOL_NAME,
  description: TOOL_DESCRIPTION,
  input_schema: inputSchema as Anthropic.Messages.Tool["input_schema"],
};
