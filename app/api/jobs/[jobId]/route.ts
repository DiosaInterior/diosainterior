import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/db/server";

/**
 * GET /api/jobs/[jobId]
 *
 * Endpoint de polling para que la página /analizando consulte el estado
 * actual de un análisis. Retorna:
 *   - status: 'queued' | 'running' | 'succeeded' | 'failed'
 *   - substage: 'pending' | 'loading_photos' | 'calling_ai' |
 *               'persisting' | 'done' | 'failed'
 *   - error_message: string | null (solo cuando status='failed')
 *
 * Auth: cookie-based via createClient() + RLS policy users_own_jobs
 * (definida en supabase/migrations/0001_initial.sql).
 *
 * Defense in depth: validamos user_id en el handler además del RLS,
 * porque AGENTS.md P5 dice "doble verificación de auth donde sea barato".
 *
 * Cadence esperada del cliente: polling cada 2s desde /analizando hasta
 * que substage === 'done' o status === 'failed'.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const user = await requireUser();
  const { jobId } = await params;

  // Shape check minimal del jobId — un UUID v4 tiene 36 chars (con
  // hyphens). Aceptamos >=32 para tolerar variaciones de formato sin
  // bloquear, pero rechazamos strings vacíos / malformados que causarían
  // SQL coercion errors al pasarlos al .eq().
  if (!jobId || jobId.length < 32) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("analysis_jobs")
    .select("id, user_id, status, substage, error_message")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    console.error(`[G.0] Job lookup failed for ${jobId}:`, error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Defense in depth: aunque la RLS policy users_own_jobs ya filtra,
  // validamos ownership explícitamente. Si un atacante con session token
  // robado lograra bypassear RLS por mis-config, este check es la segunda
  // barrera. Devolvemos 404 (no 403) para no leak la existencia del job.
  if (job.user_id !== user.id) {
    console.error(
      `[G.0] Ownership mismatch on job ${jobId}: job.user_id=${job.user_id}, session.user.id=${user.id}`,
    );
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Solo retornar campos necesarios para polling. NO retornar user_id
  // ni purchase_id (info redundante para la UI).
  return NextResponse.json({
    status: job.status,
    substage: job.substage,
    error_message: job.error_message,
  });
}
