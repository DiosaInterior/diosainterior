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
// Mocks (vi.mock hoisted before imports)
// ---------------------------------------------------------------------

const fromMock = vi.fn();

vi.mock("@/lib/db/server", () => ({
  createClient: async () => ({ from: fromMock }),
}));

import { getLatestGuideForUser } from "@/lib/db/guides";
import { validGuide } from "./fixtures/valid-guide";

// .from(table).select(cols).eq(col, val).order(...).limit(N).maybeSingle()
function chainGuideQuery(resolveValue: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),
  };
}

const USER_ID = "8a0e8037-f486-4e82-bd8e-3f1ae3149915";

let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  vi.clearAllMocks();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

describe("getLatestGuideForUser", () => {
  it("retorna la guide cuando existe (data.data → Guide tipado)", async () => {
    fromMock.mockReturnValue(
      chainGuideQuery({
        data: { data: validGuide },
        error: null,
      }),
    );

    const result = await getLatestGuideForUser(USER_ID);

    expect(result).toEqual(validGuide);
    expect(fromMock).toHaveBeenCalledWith("guides");
  });

  it("retorna null cuando el user NO tiene guides", async () => {
    fromMock.mockReturnValue(
      chainGuideQuery({ data: null, error: null }),
    );

    const result = await getLatestGuideForUser(USER_ID);
    expect(result).toBeNull();
  });

  it("retorna null + loggea cuando la query falla con error de DB", async () => {
    const dbError = { message: "rls denied" };
    fromMock.mockReturnValue(
      chainGuideQuery({ data: null, error: dbError }),
    );

    const result = await getLatestGuideForUser(USER_ID);
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    // El source loggea: console.error(`[G.1] Failed... ${userId}:`, error);
    // El error queda como SEGUNDO arg de la call, no concatenado al string.
    const firstCall = errorSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toMatch(new RegExp(`Failed to load guide.*${USER_ID}`));
    expect(firstCall?.[1]).toEqual(dbError);
  });

  it("respeta el ordering ORDER BY created_at DESC + LIMIT 1", async () => {
    const chain = chainGuideQuery({ data: { data: validGuide }, error: null });
    fromMock.mockReturnValue(chain);

    await getLatestGuideForUser(USER_ID);

    expect(chain.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(chain.eq).toHaveBeenCalledWith("user_id", USER_ID);
  });
});
