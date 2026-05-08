import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  pollOnce,
  type PollContext,
} from "@/components/analizando/_polling";
import type { Status, Substage } from "@/components/analizando/_progress";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

const JOB_ID = "8effb651-570b-4ba0-ad4a-ff725894a418";
const MAX_DURATION = 5 * 60 * 1000; // 5 min

function makeJsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

function makeContext(overrides: Partial<PollContext> = {}): PollContext {
  return {
    jobId: JOB_ID,
    prevSubstage: null,
    startedAtMs: 0,
    fetchFn: vi.fn(),
    nowMs: () => 1000, // ofset within MAX_DURATION
    signal: new AbortController().signal,
    maxDurationMs: MAX_DURATION,
    ...overrides,
  };
}

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("pollOnce — happy path transitions", () => {
  it("returns 'transition' with substageChanged=true cuando el substage es nuevo", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        makeJsonResponse({
          status: "running" as Status,
          substage: "calling_ai" as Substage,
          error_message: null,
        }),
      );
    const ctx = makeContext({
      fetchFn,
      prevSubstage: "loading_photos",
    });

    const out = await pollOnce(ctx);

    expect(out).toEqual({
      type: "transition",
      status: "running",
      substage: "calling_ai",
      substageChanged: true,
      errorMessage: null,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}`,
      expect.objectContaining({
        cache: "no-store",
        signal: ctx.signal,
      }),
    );
  });

  it("returns 'transition' with substageChanged=false cuando el substage es el mismo", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      makeJsonResponse({
        status: "running",
        substage: "calling_ai",
        error_message: null,
      }),
    );
    const ctx = makeContext({ fetchFn, prevSubstage: "calling_ai" });

    const out = await pollOnce(ctx);

    expect(out.type).toBe("transition");
    if (out.type !== "transition") throw new Error("type narrowing");
    expect(out.substageChanged).toBe(false);
  });
});

describe("pollOnce — terminal states", () => {
  it("returns 'terminal_done' cuando substage='done' y status='succeeded'", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      makeJsonResponse({
        status: "succeeded",
        substage: "done",
        error_message: null,
      }),
    );
    const ctx = makeContext({ fetchFn, prevSubstage: "persisting" });

    const out = await pollOnce(ctx);

    expect(out).toEqual({
      type: "terminal_done",
      status: "succeeded",
      substage: "done",
    });
  });

  it("returns 'terminal_failed' con errorMessage cuando status='failed'", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      makeJsonResponse({
        status: "failed",
        substage: "failed",
        error_message: "Anthropic timeout",
      }),
    );
    const ctx = makeContext({ fetchFn, prevSubstage: "calling_ai" });

    const out = await pollOnce(ctx);

    expect(out).toEqual({
      type: "terminal_failed",
      status: "failed",
      substage: "failed",
      errorMessage: "Anthropic timeout",
    });
  });

  it("returns 'terminal_failed' con errorMessage=null si el server no lo populó", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      makeJsonResponse({
        status: "failed",
        substage: "failed",
        error_message: null,
      }),
    );
    const ctx = makeContext({ fetchFn });

    const out = await pollOnce(ctx);
    expect(out.type).toBe("terminal_failed");
    if (out.type !== "terminal_failed") throw new Error("type narrowing");
    expect(out.errorMessage).toBeNull();
  });
});

describe("pollOnce — timeout (no fetch)", () => {
  it("returns 'timeout' si nowMs - startedAtMs > maxDurationMs y NO llama fetch", async () => {
    const fetchFn = vi.fn();
    const ctx = makeContext({
      fetchFn,
      startedAtMs: 0,
      nowMs: () => 6 * 60 * 1000, // 6 min, > max 5 min
    });

    const out = await pollOnce(ctx);

    expect(out).toEqual({ type: "timeout" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("NO retorna 'timeout' si elapsed === maxDurationMs (boundary inclusivo del límite)", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      makeJsonResponse({
        status: "running",
        substage: "calling_ai",
        error_message: null,
      }),
    );
    // elapsed exactamente igual a maxDurationMs → no timeout (>, no >=)
    const ctx = makeContext({
      fetchFn,
      startedAtMs: 0,
      nowMs: () => MAX_DURATION,
    });

    const out = await pollOnce(ctx);
    expect(out.type).toBe("transition");
  });
});

describe("pollOnce — network errors", () => {
  it("returns 'network_error' cuando fetch retorna res.ok=false (HTTP 500)", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    const ctx = makeContext({ fetchFn });

    const out = await pollOnce(ctx);
    expect(out).toEqual({ type: "network_error" });
  });

  it("returns 'network_error' cuando endpoint retorna 401 (cookie inválida)", async () => {
    // G.2.1: el route handler ahora retorna 401 JSON cuando getUser()
    // es null (en vez del 200+HTML del bug previo). pollOnce debe
    // tratarlo como network_error (transient, sigue polleando) — la
    // recuperación es responsabilidad del caller (ej: redirect a /login
    // tras N reintentos consecutivos).
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "unauthenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const ctx = makeContext({ fetchFn });

    const out = await pollOnce(ctx);
    expect(out).toEqual({ type: "network_error" });
  });

  it("envía credentials: 'include' en el fetch (defensive, G.2.1)", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      makeJsonResponse({
        status: "running",
        substage: "calling_ai",
        error_message: null,
      }),
    );
    const ctx = makeContext({ fetchFn });

    await pollOnce(ctx);

    expect(fetchFn).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}`,
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("returns 'network_error' cuando fetch throws non-AbortError", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ENETUNREACH"));
    const ctx = makeContext({ fetchFn });

    const out = await pollOnce(ctx);
    expect(out).toEqual({ type: "network_error" });
  });

  it("returns 'network_error' cuando body no es JSON parseable", async () => {
    // Response 200 OK pero con body inválido — .json() throws.
    const badResponse = new Response("not-valid-json{", { status: 200 });
    const fetchFn = vi.fn().mockResolvedValue(badResponse);
    const ctx = makeContext({ fetchFn });

    const out = await pollOnce(ctx);
    expect(out).toEqual({ type: "network_error" });
  });
});

describe("pollOnce — abort", () => {
  it("returns 'aborted' cuando fetch throws AbortError", async () => {
    const abortError = Object.assign(new Error("aborted"), {
      name: "AbortError",
    });
    const fetchFn = vi.fn().mockRejectedValue(abortError);
    const ctx = makeContext({ fetchFn });

    const out = await pollOnce(ctx);
    expect(out).toEqual({ type: "aborted" });
  });
});
