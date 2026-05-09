// Función pura para hacer un solo poll a /api/jobs/[jobId]. Toda la
// lógica de decisión vive acá; el hook (useJobPolling) es solo un
// wrapper React que invoca pollOnce desde un useEffect e interpreta
// el outcome para hacer setState.
//
// Pura: dado el mismo PollContext, retorna el mismo PollOutcome
// (mod side effect del fetch, que se inyecta — testeable con mock).
//
// NUNCA throws: mapea errors (network, JSON parse, abort) a outcome
// types específicos. El caller decide qué hacer con cada uno.

import type { Status, Substage } from "./_progress";

export type PollOutcome =
  | {
      type: "transition";
      status: Status;
      substage: Substage;
      substageChanged: boolean;
      errorMessage: string | null;
    }
  | {
      type: "terminal_done";
      status: "succeeded";
      substage: "done";
    }
  | {
      type: "terminal_failed";
      status: "failed";
      substage: Substage;
      errorMessage: string | null;
    }
  | { type: "timeout" }
  | { type: "network_error" }
  | { type: "aborted" };

export type PollContext = {
  jobId: string;
  prevSubstage: Substage | null;
  startedAtMs: number;
  fetchFn: typeof fetch; // inyectable para tests
  nowMs: () => number; // inyectable para tests
  signal: AbortSignal;
  maxDurationMs: number;
};

type JobResponse = {
  status: Status;
  substage: Substage;
  error_message: string | null;
};

export async function pollOnce(ctx: PollContext): Promise<PollOutcome> {
  // 1. Verificar timeout antes de gastar el fetch.
  if (ctx.nowMs() - ctx.startedAtMs > ctx.maxDurationMs) {
    return { type: "timeout" };
  }

  // 2. Hacer fetch. credentials:"include" defensivo — el default
  // "same-origin" debería bastar (mismo dominio), pero algunos edges/CDNs
  // strippean cookies en condiciones raras. Explicitamos para garantizar
  // que la cookie de auth siempre viaja al route handler.
  let res: Response;
  try {
    console.log("[POLL-E] about to fetch", {
      url: "/api/jobs/" + ctx.jobId,
      signalAborted: ctx.signal.aborted,
    });
    res = await ctx.fetchFn(`/api/jobs/${ctx.jobId}`, {
      signal: ctx.signal,
      cache: "no-store",
      credentials: "include",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { type: "aborted" };
    }
    return { type: "network_error" };
  }

  if (!res.ok) {
    return { type: "network_error" };
  }

  // 3. Parsear JSON. Body no-JSON → network_error (transient).
  let data: JobResponse;
  try {
    data = (await res.json()) as JobResponse;
  } catch {
    return { type: "network_error" };
  }

  // 4. Mapear a outcome según terminal vs progress.
  if (data.substage === "done" && data.status === "succeeded") {
    return {
      type: "terminal_done",
      status: "succeeded",
      substage: "done",
    };
  }

  if (data.status === "failed") {
    return {
      type: "terminal_failed",
      status: "failed",
      substage: data.substage,
      errorMessage: data.error_message,
    };
  }

  return {
    type: "transition",
    status: data.status,
    substage: data.substage,
    substageChanged: data.substage !== ctx.prevSubstage,
    errorMessage: data.error_message,
  };
}
