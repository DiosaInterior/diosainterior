import "server-only";
import { getAdminClient } from "@/lib/db/admin";
import { getAnthropicClient } from "@/lib/ai/clients/anthropic";
import {
  loadPhotosForUser,
  type Base64Photo,
} from "@/lib/storage/photos-loader";
import {
  buildColorimetryPrompt,
  PROMPT_VERSION,
} from "@/lib/ai/prompts/colorimetry-v2";
import {
  colorimetryTool,
  COLORIMETRY_TOOL_NAME,
} from "@/lib/ai/tools/colorimetry-tool";
import { GuideSchema, type Guide } from "@/lib/validation/guide-schema";
import { getValidHexesForSeason } from "@/lib/ai/knowledge/seasons-database";
import { APP_VERSION } from "@/lib/version";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;
// Clasificación 100% determinística. Prueba empírica con G.X.5 mostró que
// 0.3 producía drift entre seasons adyacentes warm (true_autumn vs soft_autumn)
// con valores numéricos idénticos (Munsell + CIE Lab + Fitzpatrick bit-for-bit).
// La marca requiere una sola etiqueta estable por usuaria. La prosa del rationale
// sigue siendo natural por la riqueza del system prompt + voz §13 templeted.
const TEMPERATURE = 0;

type AnalysisJob = {
  id: string;
  user_id: string;
  purchase_id: string;
  status: "queued" | "running" | "succeeded" | "failed";
};

/**
 * Orquesta el análisis colorimétrico end-to-end para un job.
 *
 * Flujo:
 *  1. Carga el job desde DB
 *  2. Marca status='running' + started_at
 *  3. Carga 4 fotos del Storage del user_id del job
 *  4. Llama a Anthropic con system prompt + 4 imágenes + tool forzado
 *  5. Valida tool input con GuideSchema (Zod)
 *  6. Soft cross-validation de hex (warnings only, no rechazo)
 *  7. Persiste guide en DB con denormalized fields + JSONB completo
 *  8. Marca job status='succeeded' + completed_at
 *
 * En caso de error en cualquier paso 3-7:
 *  - Marca job status='failed' + error_message
 *  - Re-throw para que el caller (F.4 Inngest) gestione retry
 *
 * Esta función es idempotente al fallar pero NO al succeed: si ya hay
 * un guide para este job_id, persistGuide va a fallar por uniqueness.
 * F.4 va a manejar idempotencia a nivel cola (no llamar 2x al mismo job).
 */
export async function runColorimetricAnalysis(jobId: string): Promise<void> {
  const supabase = getAdminClient();

  // 1. Cargar job
  const { data: jobRow, error: jobError } = await supabase
    .from("analysis_jobs")
    .select("id, user_id, purchase_id, status")
    .eq("id", jobId)
    .single();

  if (jobError || !jobRow) {
    throw new Error(
      `Job ${jobId} not found: ${jobError?.message ?? "no row"}`,
    );
  }
  const job = jobRow as AnalysisJob;

  if (job.status !== "queued") {
    throw new Error(
      `Job ${jobId} has status '${job.status}', expected 'queued'`,
    );
  }

  // 2. Marcar running + arrancar substage 'loading_photos'.
  // Un solo UPDATE atómico mueve status y substage juntos para que la
  // usuaria vea progreso desde el primer poll (G.0/G.1).
  await supabase
    .from("analysis_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      attempts: 1,
      substage: "loading_photos",
    })
    .eq("id", jobId);

  try {
    // 3. Cargar fotos
    const photos = await loadPhotosForUser(job.user_id);

    // 4. Substage tick → llamar Anthropic
    await supabase
      .from("analysis_jobs")
      .update({ substage: "calling_ai" })
      .eq("id", jobId);
    const toolInput = await callAnthropic(photos);

    // 5. Validar shape con Zod
    const guide = GuideSchema.parse(toolInput);

    // 6. Soft cross-validation hex (warnings only)
    const warnings = validateHexCrossReference(guide);
    if (warnings.length > 0) {
      console.warn(
        `[F.3] Job ${jobId} hex warnings (${warnings.length}):`,
        warnings,
      );
    }

    // 7. Substage tick → persistir guide
    await supabase
      .from("analysis_jobs")
      .update({ substage: "persisting" })
      .eq("id", jobId);
    await persistGuide({
      jobId: job.id,
      userId: job.user_id,
      guide,
    });

    // 8. Marcar succeeded + substage 'done' en un solo UPDATE atómico.
    await supabase
      .from("analysis_jobs")
      .update({
        status: "succeeded",
        completed_at: new Date().toISOString(),
        substage: "done",
      })
      .eq("id", jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[F.3] Job ${jobId} failed:`, message);

    await supabase
      .from("analysis_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message.slice(0, 500), // cap a 500 chars
        substage: "failed",
      })
      .eq("id", jobId);

    throw error; // re-throw para F.4 (Inngest) gestione retry
  }
}

/**
 * Llama a Anthropic con system prompt + 4 imágenes + tool forzado.
 * Retorna el input del tool_use block (unknown — validación Zod en caller).
 */
async function callAnthropic(photos: Base64Photo[]): Promise<unknown> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: buildColorimetryPrompt(),
    tools: [colorimetryTool],
    tool_choice: { type: "tool", name: COLORIMETRY_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          ...photos.map((p) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: p.mediaType,
              data: p.data,
            },
          })),
          {
            type: "text" as const,
            text: "Analiza estas 4 fotos siguiendo el sistema definido. Llama al tool submit_colorimetric_analysis con tu análisis completo.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      `Anthropic response did not contain a tool_use block. stop_reason: ${response.stop_reason}`,
    );
  }
  if (toolUse.name !== COLORIMETRY_TOOL_NAME) {
    throw new Error(
      `Unexpected tool_use name: ${toolUse.name} (expected ${COLORIMETRY_TOOL_NAME})`,
    );
  }

  return toolUse.input;
}

/**
 * Soft cross-validation: cada hex en palette.colors debería estar en
 * la lista canónica irradian de la season retornada. Si no, log
 * warning pero NO rechazar (decisión Q4).
 *
 * Si en F.5 vemos >20% de jobs con warnings, ajustamos prompt en v2.1.0.
 */
function validateHexCrossReference(guide: Guide): string[] {
  const warnings: string[] = [];
  const seasonId = guide.scientific.season;
  const validHexes = new Set(
    getValidHexesForSeason(seasonId).map((h) => h.toLowerCase()),
  );

  for (const color of guide.palette.colors) {
    if (!validHexes.has(color.hex.toLowerCase())) {
      warnings.push(
        `Hex ${color.hex} (${color.nombre}) not in canonical irradian list for ${seasonId}`,
      );
    }
  }

  return warnings;
}

/**
 * Persiste el guide validado en la tabla guides. Inyecta APP_VERSION
 * (no viene del modelo) y mapea fields denormalizados desde scientific.
 */
async function persistGuide(params: {
  jobId: string;
  userId: string;
  guide: Guide;
}): Promise<void> {
  const supabase = getAdminClient();
  const { jobId, userId, guide } = params;

  const { error } = await supabase.from("guides").insert({
    user_id: userId,
    job_id: jobId,
    fitzpatrick: guide.scientific.fitzpatrick,
    season: guide.scientific.season,
    undertone: guide.scientific.undertone,
    munsell_notation: guide.scientific.munsell_notation,
    cie_lab: guide.scientific.cie_lab,
    data: guide,
    prompt_version: PROMPT_VERSION,
    app_version: APP_VERSION,
  });

  if (error) {
    throw new Error(
      `Failed to persist guide for job ${jobId}: ${error.message}`,
    );
  }
}
