import "server-only";
import * as Sentry from "@sentry/nextjs";
import { eventType, staticSchema } from "inngest";

import { inngest } from "@/inngest/client";
import { getAdminClient } from "@/lib/db/admin";
import { runColorimetricAnalysis } from "@/lib/ai/services/analysis-service";
import { PROMPT_VERSION } from "@/lib/ai/prompts/colorimetry-v2";

const MODEL = "claude-sonnet-4-6";

// Trigger tipado: eventType + staticSchema da type safety en event.data
// dentro del handler (Inngest 4.x). staticSchema NO valida en runtime —
// es solo type info; los datos vienen del webhook que ya validó upstream.
const purchasePaidTrigger = eventType("purchase/paid", {
  schema: staticSchema<{ purchaseId: string; userId: string }>(),
});

// Tipo del input del handler: subset de Inngest's full Context que solo
// expone lo que el handler usa. Permite testear el handler con un mock
// step sin depender del runtime completo de Inngest.
type AnalyzePurchaseInput = {
  event: { data: { purchaseId: string; userId: string } };
  step: {
    run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
  };
};

/**
 * Handler core de la Inngest function. Exportado para testing directo
 * sin depender de utilidades de Inngest (4.x no expone testing utils
 * como `createStepTools` en su API pública).
 *
 * Flow en 2 steps con retry granular:
 *  1. create-job: INSERT analysis_jobs (status='queued')
 *     - Idempotencia: si ya existe job para este purchase_id, retorna su id
 *  2. run-analysis: invoca runColorimetricAnalysis(jobId) de F.3
 *     - Si falla, F.3 ya marca job 'failed' y re-throws
 *     - Inngest reintenta automáticamente (retries default = 3)
 */
export async function handleAnalyzePurchase({
  event,
  step,
}: AnalyzePurchaseInput): Promise<{ jobId: string; purchaseId: string }> {
  const { purchaseId, userId } = event.data;

  // STEP 1: Crear el analysis_jobs row (idempotente)
  const jobId = await step.run("create-job", async () => {
    const supabase = getAdminClient();

    // Idempotencia: ¿ya existe job para este purchase?
    const { data: existing, error: lookupError } = await supabase
      .from("analysis_jobs")
      .select("id, status")
      .eq("purchase_id", purchaseId)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`Lookup failed: ${lookupError.message}`);
    }
    if (existing) {
      console.log(
        `[F.4] Job already exists for purchase ${purchaseId} (id=${existing.id}, status=${existing.status}), skipping create`,
      );
      return existing.id;
    }

    // INSERT nuevo job
    const { data: job, error: insertError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        purchase_id: purchaseId,
        status: "queued",
        prompt_version: PROMPT_VERSION,
        model: MODEL,
      })
      .select("id")
      .single();

    if (insertError || !job) {
      throw new Error(
        `Failed to create analysis_job: ${insertError?.message ?? "no row returned"}`,
      );
    }

    console.log(`[F.4] Created job ${job.id} for purchase ${purchaseId}`);
    return job.id;
  });

  // STEP 2: Ejecutar el análisis (F.3)
  await step.run("run-analysis", async () => {
    console.log(`[F.4] Running analysis for job ${jobId}`);
    await runColorimetricAnalysis(jobId);
    console.log(`[F.4] Analysis succeeded for job ${jobId}`);
  });

  return { jobId, purchaseId };
}

/**
 * Inngest function que se dispara cuando se emite el evento
 * "purchase/paid". El webhook de Stripe lo emite tras marcar
 * `purchases.status='paid'`.
 *
 * Dedup a nivel evento: el caller de `inngest.send()` pasa
 * `id: 'purchase-paid-${purchaseId}'` para que Inngest deduplique
 * eventos repetidos durante 24h (defense in depth con la idempotencia
 * primaria de `webhook_events`).
 *
 * Errores fatales (después de retries agotados): Sentry.captureException
 * vía `onFailure`, cumpliendo P6 de AGENTS.md.
 */
export const analyzePurchase = inngest.createFunction(
  {
    id: "analyze-purchase",
    name: "Analyze purchase (colorimetric analysis)",
    retries: 3, // explícito (es el default; lo dejamos visible)
    triggers: [purchasePaidTrigger],
    onFailure: async ({ event, error }) => {
      // event aquí es FailureEventPayload con event.data.event = el evento original.
      const original = event.data.event as {
        data?: { purchaseId?: string };
      };
      const purchaseId = original.data?.purchaseId ?? "unknown";
      Sentry.captureException(error, {
        tags: {
          inngest_function: "analyze-purchase",
          purchase_id: purchaseId,
        },
      });
      console.error(
        `[F.4] analyze-purchase exhausted retries for purchase ${purchaseId}:`,
        error,
      );
    },
  },
  handleAnalyzePurchase,
);
