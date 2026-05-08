import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { runColorimetricAnalysis } from "@/lib/ai/services/analysis-service";

/**
 * Dev-only endpoint para invocar análisis manualmente sin Inngest.
 * Usar via:
 *   curl -X POST http://localhost:3000/api/dev/analyze \
 *     -H "Content-Type: application/json" \
 *     -d '{"jobId":"<uuid del analysis_jobs row>"}'
 *
 * Gated por NODE_ENV !== 'development' — devuelve 404 en producción.
 *
 * F.4 va a reemplazar este endpoint con una Inngest function que se
 * dispara desde el webhook de Stripe (checkout.session.completed).
 */
export const runtime = "nodejs"; // necesario para Anthropic SDK
export const maxDuration = 120; // 2 minutos, igual al timeout del cliente

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: { jobId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { jobId } = body;
  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json(
      { error: "jobId (string) required" },
      { status: 400 },
    );
  }

  try {
    await runColorimetricAnalysis(jobId);
    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
