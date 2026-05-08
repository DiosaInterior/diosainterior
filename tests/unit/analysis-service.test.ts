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
      .mockReturnValueOnce(chainUpdateEq({ error: null })) // 2. UPDATE running
      .mockReturnValueOnce(chainInsert({ error: null })) // 3. INSERT guide
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // 4. UPDATE succeeded

    messagesCreate.mockResolvedValue(makeToolUseResponse(validGuide));

    await runColorimetricAnalysis(JOB_ID);

    expect(loadPhotosMock).toHaveBeenCalledWith(USER_ID);
    expect(messagesCreate).toHaveBeenCalledOnce();
    expect(fromMock).toHaveBeenCalledTimes(4);

    // Verify Anthropic call shape — tool_choice forces submit_colorimetric_analysis.
    const callArgs = messagesCreate.mock.calls[0]?.[0];
    expect(callArgs.tool_choice).toEqual({
      type: "tool",
      name: "submit_colorimetric_analysis",
    });
    expect(callArgs.tools).toHaveLength(1);
    expect(callArgs.system).toContain("Diosa Interior");
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
  function setupThroughRunning() {
    fromMock
      .mockReturnValueOnce(
        chainSelectEqSingle({ data: queuedJob, error: null }),
      )
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // mark running
  }

  it("marks failed when Anthropic returns no tool_use block", async () => {
    setupThroughRunning();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null })); // mark failed

    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "Cannot complete" }],
      stop_reason: "end_turn",
    });

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /did not contain a tool_use/,
    );
    // SELECT + UPDATE running + UPDATE failed = 3 calls.
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  it("marks failed when tool_use name is wrong", async () => {
    setupThroughRunning();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null }));

    messagesCreate.mockResolvedValue(
      makeToolUseResponse({}, "wrong_tool_name"),
    );

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /Unexpected tool_use name/,
    );
  });

  it("marks failed when tool input fails Zod validation", async () => {
    setupThroughRunning();
    fromMock.mockReturnValueOnce(chainUpdateEq({ error: null }));

    messagesCreate.mockResolvedValue(
      makeToolUseResponse({ scientific: { fitzpatrick: 99 } }),
    );

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow();
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
  });

  it("marks failed when persist guide returns DB error", async () => {
    setupThroughRunning();
    fromMock
      .mockReturnValueOnce(
        chainInsert({ error: { message: "constraint violation" } }),
      ) // INSERT guide
      .mockReturnValueOnce(chainUpdateEq({ error: null })); // UPDATE failed

    messagesCreate.mockResolvedValue(makeToolUseResponse(validGuide));

    await expect(runColorimetricAnalysis(JOB_ID)).rejects.toThrow(
      /constraint violation/,
    );
  });
});

describe("runColorimetricAnalysis — soft hex cross-validation", () => {
  it("logs warning but succeeds when palette hex is not in canonical irradian list", async () => {
    const guideWithBadHex: Guide = {
      ...validGuide,
      palette: {
        ...validGuide.palette,
        colors: validGuide.palette.colors.map((c, i) =>
          i === 0 ? { ...c, hex: "#ABCDEF" } : c,
        ),
      },
    };

    fromMock
      .mockReturnValueOnce(
        chainSelectEqSingle({ data: queuedJob, error: null }),
      )
      .mockReturnValueOnce(chainUpdateEq({ error: null }))
      .mockReturnValueOnce(chainInsert({ error: null }))
      .mockReturnValueOnce(chainUpdateEq({ error: null }));

    messagesCreate.mockResolvedValue(makeToolUseResponse(guideWithBadHex));

    await runColorimetricAnalysis(JOB_ID);

    expect(warnSpy).toHaveBeenCalled();
    const warnArgs = warnSpy.mock.calls.flat().map(String).join(" ");
    expect(warnArgs).toMatch(/#ABCDEF/i);
    expect(warnArgs).toMatch(/true_spring/);
  });
});
