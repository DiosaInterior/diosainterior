import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

// ---------------------------------------------------------------------
// Mocks (declared before imports of SUT — vi.mock is hoisted)
// ---------------------------------------------------------------------

const fromMock = vi.fn();
const runColorimetricAnalysisMock = vi.fn();

vi.mock("@/lib/db/admin", () => ({
  getAdminClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/ai/services/analysis-service", () => ({
  runColorimetricAnalysis: (jobId: string) =>
    runColorimetricAnalysisMock(jobId),
}));

import { handleAnalyzePurchase } from "@/inngest/functions/analyze-purchase";

// ---------------------------------------------------------------------
// Chain builders (Supabase-style fluent mocks)
// ---------------------------------------------------------------------

// .from(table).select(cols).eq(col, val).maybeSingle() → Promise
function chainSelectEqMaybeSingle(resolveValue: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),
  };
}

// .from(table).insert({...}).select(cols).single() → Promise
function chainInsertSelectSingle(resolveValue: unknown) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
  };
}

// step.run mock: ejecuta el callback directo (sin durabilidad de Inngest).
// vi.fn() pierde el genérico al envolver en Mock<F>, así que casteamos el
// return type para que satisfaga el tipo strict del handler. .mock sigue
// accesible para inspeccionar calls.
type StepArg = Parameters<typeof handleAnalyzePurchase>[0]["step"];
type StepWithSpy = StepArg & {
  run: StepArg["run"] & { mock: ReturnType<typeof vi.fn>["mock"] };
};

function makeStep(): StepWithSpy {
  const runImpl = <T>(_id: string, fn: () => Promise<T>): Promise<T> => fn();
  const run = vi.fn(runImpl);
  return { run } as unknown as StepWithSpy;
}

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------

const PURCHASE_ID = "00000000-0000-0000-0000-000000000aaa";
const USER_ID = "00000000-0000-0000-0000-000000000bbb";
const NEW_JOB_ID = "00000000-0000-0000-0000-000000000ccc";
const EXISTING_JOB_ID = "00000000-0000-0000-0000-000000000ddd";

const event = {
  data: { purchaseId: PURCHASE_ID, userId: USER_ID },
};

let logSpy: MockInstance<typeof console.log>;

beforeEach(() => {
  vi.clearAllMocks();
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  logSpy.mockRestore();
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe("handleAnalyzePurchase — happy path", () => {
  it("crea job nuevo y ejecuta análisis", async () => {
    fromMock
      // 1. lookup existing → none
      .mockReturnValueOnce(
        chainSelectEqMaybeSingle({ data: null, error: null }),
      )
      // 2. INSERT new job
      .mockReturnValueOnce(
        chainInsertSelectSingle({ data: { id: NEW_JOB_ID }, error: null }),
      );
    runColorimetricAnalysisMock.mockResolvedValue(undefined);

    const step = makeStep();
    const result = await handleAnalyzePurchase({ event, step });

    expect(result).toEqual({ jobId: NEW_JOB_ID, purchaseId: PURCHASE_ID });
    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(fromMock).toHaveBeenNthCalledWith(1, "analysis_jobs");
    expect(fromMock).toHaveBeenNthCalledWith(2, "analysis_jobs");
    expect(runColorimetricAnalysisMock).toHaveBeenCalledWith(NEW_JOB_ID);
    expect(step.run).toHaveBeenCalledTimes(2);
    expect(step.run.mock.calls[0]?.[0]).toBe("create-job");
    expect(step.run.mock.calls[1]?.[0]).toBe("run-analysis");
  });
});

describe("handleAnalyzePurchase — idempotencia", () => {
  it("reusa job existente sin INSERT", async () => {
    fromMock.mockReturnValueOnce(
      chainSelectEqMaybeSingle({
        data: { id: EXISTING_JOB_ID, status: "queued" },
        error: null,
      }),
    );
    runColorimetricAnalysisMock.mockResolvedValue(undefined);

    const step = makeStep();
    const result = await handleAnalyzePurchase({ event, step });

    expect(result.jobId).toBe(EXISTING_JOB_ID);
    expect(fromMock).toHaveBeenCalledTimes(1); // solo lookup, no insert
    expect(runColorimetricAnalysisMock).toHaveBeenCalledWith(EXISTING_JOB_ID);
  });

  it("reusa job existente aunque su status sea 'failed' (Inngest retriggerea)", async () => {
    fromMock.mockReturnValueOnce(
      chainSelectEqMaybeSingle({
        data: { id: EXISTING_JOB_ID, status: "failed" },
        error: null,
      }),
    );
    runColorimetricAnalysisMock.mockResolvedValue(undefined);

    const step = makeStep();
    const result = await handleAnalyzePurchase({ event, step });

    expect(result.jobId).toBe(EXISTING_JOB_ID);
    expect(runColorimetricAnalysisMock).toHaveBeenCalledWith(EXISTING_JOB_ID);
  });
});

describe("handleAnalyzePurchase — failures (propagated, Inngest reintenta)", () => {
  it("throws cuando lookup DB falla", async () => {
    fromMock.mockReturnValueOnce(
      chainSelectEqMaybeSingle({
        data: null,
        error: { message: "rls denied" },
      }),
    );

    const step = makeStep();
    await expect(handleAnalyzePurchase({ event, step })).rejects.toThrow(
      /Lookup failed.*rls denied/,
    );
    expect(runColorimetricAnalysisMock).not.toHaveBeenCalled();
  });

  it("throws cuando INSERT del job falla", async () => {
    fromMock
      .mockReturnValueOnce(
        chainSelectEqMaybeSingle({ data: null, error: null }),
      )
      .mockReturnValueOnce(
        chainInsertSelectSingle({
          data: null,
          error: { message: "constraint violation" },
        }),
      );

    const step = makeStep();
    await expect(handleAnalyzePurchase({ event, step })).rejects.toThrow(
      /constraint violation/,
    );
    expect(runColorimetricAnalysisMock).not.toHaveBeenCalled();
  });

  it("throws cuando runColorimetricAnalysis falla (post create)", async () => {
    fromMock
      .mockReturnValueOnce(
        chainSelectEqMaybeSingle({ data: null, error: null }),
      )
      .mockReturnValueOnce(
        chainInsertSelectSingle({ data: { id: NEW_JOB_ID }, error: null }),
      );
    runColorimetricAnalysisMock.mockRejectedValue(
      new Error("Anthropic timeout"),
    );

    const step = makeStep();
    await expect(handleAnalyzePurchase({ event, step })).rejects.toThrow(
      /Anthropic timeout/,
    );
    // El job ya quedó creado; F.3 lo marca 'failed'. Inngest reintenta
    // este step con el mismo jobId (la idempotencia del step 1 lo reusa).
    expect(runColorimetricAnalysisMock).toHaveBeenCalledWith(NEW_JOB_ID);
  });
});
