import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import type { Guide } from "@/lib/validation/guide-schema";
import { validGuide } from "./fixtures/valid-guide";

// ---------------------------------------------------------------------
// Mocks (declared before imports of SUT — vi.mock is hoisted)
// ---------------------------------------------------------------------

const messagesCreate = vi.fn();
const fromMock = vi.fn();
const loadPhotosMock = vi.fn();

vi.mock("@/lib/ai/clients/anthropic", () => ({
  getAnthropicClient: () => ({
    messages: { create: messagesCreate },
  }),
}));

vi.mock("@/lib/db/admin", () => ({
  getAdminClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/storage/photos-loader", () => ({
  loadPhotosForUser: (userId: string) => loadPhotosMock(userId),
}));

import { runColorimetricAnalysis } from "@/lib/ai/services/analysis-service";

// ---------------------------------------------------------------------
// Chain builders (Supabase-style fluent mocks)
// ---------------------------------------------------------------------

// .from(table).select(cols).eq(col, val).single() → Promise
function chainSelectEqSingle(resolveValue: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

// .from(table).update({...}).eq(col, val) → Promise
function chainUpdateEq(resolveValue: unknown) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(resolveValue),
  };
}

// .from(table).insert({...}) → Promise
function chainInsert(resolveValue: unknown) {
  return {
    insert: vi.fn().mockResolvedValue(resolveValue),
  };
}

// Helper: junta los args de TODOS los .update({...}) que se llamaron en
// cualquier chain durante el test. Útil para asertar sobre el shape de
// los UPDATEs intermedios (substage transitions de G.0).
function allUpdateCalls(): Array<Record<string, unknown>> {
  return fromMock.mock.results.flatMap((r) => {
    const chain = r.value as {
      update?: { mock?: { calls?: unknown[][] } };
    };
    return (
      chain.update?.mock?.calls?.map(
        (c) => c[0] as Record<string, unknown>,
      ) ?? []
    );
  });
}

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------

const JOB_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000002";
const PURCHASE_ID = "00000000-0000-0000-0000-000000000003";

const queuedJob = {
  id: JOB_ID,
  user_id: USER_ID,
  purchase_id: PURCHASE_ID,
  status: "queued",
};

const fakePhotos = [
  { data: "AAAA", mediaType: "image/jpeg", position: 1 },
  { data: "BBBB", mediaType: "image/jpeg", position: 2 },
  { data: "CCCC", mediaType: "image/jpeg", position: 3 },
  { data: "DDDD", mediaType: "image/jpeg", position: 4 },
];

function makeToolUseResponse(
  input: unknown,
  toolName = "submit_colorimetric_analysis",
) {
  return {
    content: [
      { type: "tool_use" as const, name: toolName, id: "tool_1", input },
    ],
    stop_reason: "tool_use",
  };
}

// Silence noisy logs (analysis service logs warnings + errors by design).
let warnSpy: MockInstance<typeof console.warn>;
let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  vi.clearAllMocks();
  loadPhotosMock.mockResolvedValue(fakePhotos);
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe("runColorimetricAnalysis — happy path", () => {
  it("orquesta load → call → validate → persist → mark succeeded", async () => {
    fromMock
      .mockReturnValueOnce(
        chainSelectEqSingle({ data: queuedJob, error: null }),
      ) // 1. SELECT job
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // 2. UPDATE running + loading_photos
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // 3. UPDATE calling_ai
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // 4. UPDATE persisting
      .mockReturnValueOnce(chainInsert({ error: null })) // 5. INSERT guide
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // 6. UPDATE succeeded + done

    messagesCreate.mockResolvedValue(makeToolUseResponse(validGuide));

    await runColorimetricAnalysis(JOB_ID);

    expect(loadPhotosMock).toHaveBeenCalledWith(USER_ID);
    expect(messagesCreate).toHaveBeenCalledOnce();
    // 6 .from() calls: SELECT + 4 UPDATEs + 1 INSERT (G.0 progress ticks).
    expect(fromMock).toHaveBeenCalledTimes(6);

    // Verify substage transitions emitted in order (G.0).
    const updates = allUpdateCalls();
    expect(updates).toEqual([
      expect.objectContaining({
        status: "running",
        substage: "loading_photos",
      }),
      { substage: "calling_ai" },
      { substage: "persisting" },
      expect.objectContaining({ status: "succeeded", substage: "done" }),
    ]);

    // Verify Anthropic call shape — tool_choice forces submit_colorimetric_analysis.
    const callArgs = messagesCreate.mock.calls[0]?.[0];
    expect(callArgs.tool_choice).toEqual({
      type: "tool",
      name: "submit_colorimetric_analysis",
    });
    expect(callArgs.tools).toHaveLength(1);
    expect(callArgs.system).toContain("Diosa Interior");
    // temperature: 0 — clasificación 100% determinística (G.X.5 mostró
    // drift entre seasons warm adyacentes con 0.3).
    expect(callArgs.temperature).toBe(0);
    // 4 image blocks + 1 text block in user message.
    expect(callArgs.messages[0].content).toHaveLength(5);
  });
});

describe("runColorimetricAnalysis — early failures (don't reach mark-running)", () => {
  it("throws if job not found in DB", async () => {
    fromMock.mockReturnValueOnce(
      chainSelectEqSingle({
        data: null,
        error: { message: "no rows returned" },
      }),
    );
    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /not found/,
    );
    // Only 1 .from() call — never reached the UPDATE.
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("throws if job status != 'queued'", async () => {
    fromMock.mockReturnValueOnce(
      chainSelectEqSingle({
        data: { ...queuedJob, status: "running" },
        error: null,
      }),
    );
    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /'running'.*expected 'queued'/,
    );
    expect(fromMock).toHaveBeenCalledTimes(1);
  });
});

describe("runColorimetricAnalysis — failures during analysis (mark failed)", () => {
  // setupThroughRunning: mockea SELECT job + UPDATE running+loading_photos.
  // Tests que fallan ANTES de Anthropic (loadPhotos throws) usan solo esto.
  function setupThroughRunning() {
    fromMock
      .mockReturnValueOnce(
        chainSelectEqSingle({ data: queuedJob, error: null }),
      )
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // mark running + loading_photos
  }

  // setupThroughCallingAi: extiende setupThroughRunning con UPDATE calling_ai.
  // Tests que fallan DURANTE/POST Anthropic call usan esto.
  function setupThroughCallingAi() {
    setupThroughRunning();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null })); // UPDATE calling_ai
  }

  it("marks failed when Anthropic returns no tool_use block", async () => {
    setupThroughCallingAi();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null })); // mark failed

    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "Cannot complete" }],
      stop_reason: "end_turn",
    });

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /did not contain a tool_use/,
    );
    // SELECT + UPDATE running + UPDATE calling_ai + UPDATE failed = 4 calls.
    expect(fromMock).toHaveBeenCalledTimes(4);
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "failed", status: "failed" }),
    );
  });

  it("marks failed when tool_use name is wrong", async () => {
    setupThroughCallingAi();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null }));

    messagesCreate.mockResolvedValue(
      makeToolUseResponse({}, "wrong_tool_name"),
    );

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /Unexpected tool_use name/,
    );
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "failed" }),
    );
  });

  it("marks failed when tool input fails Zod validation", async () => {
    setupThroughCallingAi();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null }));

    messagesCreate.mockResolvedValue(
      makeToolUseResponse({ scientific: { fitzpatrick: 99 } }),
    );

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow();
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "failed" }),
    );
  });

  it("marks failed when photos loader throws", async () => {
    setupThroughRunning();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null }));

    loadPhotosMock.mockRejectedValueOnce(
      new Error("Expected 4 photos for user X, got 2"),
    );

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(/got 2/);
    // Anthropic should never have been called.
    expect(messagesCreate).not.toHaveBeenCalled();
    // SELECT + UPDATE running + UPDATE failed = 3 calls (skips calling_ai tick).
    expect(fromMock).toHaveBeenCalledTimes(3);
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "failed" }),
    );
  });

  it("marks failed when persist guide returns DB error", async () => {
    setupThroughCallingAi();
    fromMock
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // UPDATE persisting
      .mockReturnValueOnce(
        chainInsert({ error: { message: "constraint violation" } }),
      ) // INSERT guide → fails
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // UPDATE failed

    messagesCreate.mockResolvedValue(makeToolUseResponse(validGuide));

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /constraint violation/,
    );
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "persisting" }),
    );
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "failed" }),
    );
  });
});

describe("runColorimetricAnalysis — soft hex cross-validation", () => {
  it("logs warning but succeeds when palette hex is not in canonical irradian list", async () => {
    const guideWithBadHex: Guide = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        // G.6.B — antes era palette.colors, ahora palette.hero.
        hero: validGuide.palette.hero.map((c, i) =>
          i === 0 ? { ...c, hex: "#ABCDEF" } : c,
        ),
      },
    };

    fromMock
      .mockReturnValueOnce(
        chainSelectEqSingle({ data: queuedJob, error: null }),
      ) // SELECT job
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // UPDATE running + loading_photos
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // UPDATE calling_ai
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // UPDATE persisting
      .mockReturnValueOnce(chainInsert({ error: null })) // INSERT guide
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // UPDATE succeeded + done

    messagesCreate.mockResolvedValue(makeToolUseResponse(guideWithBadHex));

    await runColorimetricAnalysis(JOB_ID);

    expect(warnSpy).toHaveBeenCalled();
    const warnArgs = warnSpy.mock.calls.flat().map(String).join(" ");
    expect(warnArgs).toMatch(/#ABCDEF/i);
    expect(warnArgs).toMatch(/true_spring/);
    // Substage transitions emitted as in happy path.
    expect(allUpdateCalls()).toContainEqual(
      expect.objectContaining({ substage: "done", status: "succeeded" }),
    );
  });
});
