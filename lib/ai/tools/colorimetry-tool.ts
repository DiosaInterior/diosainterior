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

const TOOL_DESCRIPTION = `Submits the complete colorimetric guide for the user's photos. \
You MUST call this tool exactly once with the full guide payload. \
Returns a comprehensive colorimetric guide including: \
scientific profile (Fitzpatrick I-VI, season from 14 canonical categories, \
Munsell hue/value/chroma, CIE Lab, undertone enum, contrast level), \
hero palette (6 colors from the season's irradian list) + \
extended palette (8-15 colors from irradian, may overlap with hero), \
colors to avoid (8-12 with descriptive Spanish names), \
6 occasion-specific sub-palettes (diario, trabajo, noche, formal, casual, evento), \
makeup recommendations across 5 categories with fixed counts \
(lipstick: 5, blush: 3, eyeshadow: 6, eyeliner: 3, foundation: 3), \
jewelry metal recommendation with rationale, \
haircut suggestion with rationale, \
and a top-level narrative_voice paragraph (80-150 words) in brand tone \
(intimate-expert, declarative, addressing the user as 'tu').`;

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
