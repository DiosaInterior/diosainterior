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

const getUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  getUser: () => getUserMock(),
}));

vi.mock("@/lib/db/server", () => ({
  createClient: async () => ({ from: fromMock }),
}));

import { GET } from "@/app/api/jobs/[jobId]/route";

// ---------------------------------------------------------------------
// Chain builder
// ---------------------------------------------------------------------

// .from(table).select(cols).eq(col, val).maybeSingle() → Promise
function chainSelectEqMaybeSingle(resolveValue: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),
  };
}

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------

const USER_ID = "00000000-0000-0000-0000-000000000aaa";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000bbb";
const JOB_ID = "8effb651-570b-4ba0-ad4a-ff725894a418"; // 36 chars

const fakeUser = { id: USER_ID } as { id: string };

// Helper: arma el shape de args que Next pasa al GET handler.
// (params es Promise<{...}> en App Router 16.x.)
function makeArgs(jobId: string) {
  return {
    params: Promise.resolve({ jobId }),
  };
}

// El primer arg del handler es NextRequest; en estos tests NO leemos
// nada del request, así que pasamos un cast minimal.
const fakeRequest = {} as Parameters<typeof GET>[0];

let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue(fakeUser);
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe("GET /api/jobs/[jobId] — happy path", () => {
  it("returns 200 + {status, substage, error_message} cuando el job existe y es del user", async () => {
    fromMock.mockReturnValue(
      chainSelectEqMaybeSingle({
        data: {
          id: JOB_ID,
          user_id: USER_ID,
          status: "running",
          substage: "calling_ai",
          error_message: null,
        },
        error: null,
      }),
    );

    const res = await GET(fakeRequest, makeArgs(JOB_ID));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      status: "running",
      substage: "calling_ai",
      error_message: null,
    });
    // Solo se exponen los 3 campos — NO leak de user_id / purchase_id.
    expect(body).not.toHaveProperty("user_id");
    expect(body).not.toHaveProperty("purchase_id");
  });

  it("retorna error_message cuando el job está failed", async () => {
    fromMock.mockReturnValue(
      chainSelectEqMaybeSingle({
        data: {
          id: JOB_ID,
          user_id: USER_ID,
          status: "failed",
          substage: "failed",
          error_message: "Anthropic timeout",
        },
        error: null,
      }),
    );

    const res = await GET(fakeRequest, makeArgs(JOB_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.error_message).toBe("Anthropic timeout");
  });
});

describe("GET /api/jobs/[jobId] — auth", () => {
  it("returns 401 JSON cuando getUser() retorna null", async () => {
    getUserMock.mockResolvedValue(null);

    const res = await GET(fakeRequest, makeArgs(JOB_ID));

    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body = await res.json();
    expect(body).toEqual({ error: "unauthenticated" });
    // No debe haber tocado la DB.
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/jobs/[jobId] — invalid input", () => {
  it("returns 400 cuando el jobId está vacío", async () => {
    const res = await GET(fakeRequest, makeArgs(""));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid job id/);
    // No debe haber ido a la DB.
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns 400 cuando el jobId es muy corto", async () => {
    const res = await GET(fakeRequest, makeArgs("short"));
    expect(res.status).toBe(400);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/jobs/[jobId] — not found / ownership", () => {
  it("returns 404 cuando el job no existe", async () => {
    fromMock.mockReturnValue(
      chainSelectEqMaybeSingle({ data: null, error: null }),
    );

    const res = await GET(fakeRequest, makeArgs(JOB_ID));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 404 (no 403) cuando el job es de otro usuario", async () => {
    fromMock.mockReturnValue(
      chainSelectEqMaybeSingle({
        data: {
          id: JOB_ID,
          user_id: OTHER_USER_ID,
          status: "running",
          substage: "calling_ai",
          error_message: null,
        },
        error: null,
      }),
    );

    const res = await GET(fakeRequest, makeArgs(JOB_ID));
    expect(res.status).toBe(404); // 404, no 403, para no leak existencia
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
    // Loggea el mismatch para auditoría.
    expect(errorSpy).toHaveBeenCalled();
    const errArgs = errorSpy.mock.calls.flat().map(String).join(" ");
    expect(errArgs).toMatch(/Ownership mismatch/);
  });
});

describe("GET /api/jobs/[jobId] — DB errors", () => {
  it("returns 500 cuando la query a la DB falla", async () => {
    fromMock.mockReturnValue(
      chainSelectEqMaybeSingle({
        data: null,
        error: { message: "connection lost" },
      }),
    );

    const res = await GET(fakeRequest, makeArgs(JOB_ID));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Lookup failed/);
    expect(errorSpy).toHaveBeenCalled();
  });
});
