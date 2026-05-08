import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import type Stripe from "stripe";

// Env hoisting + module mocks (vi.mock se hoistea arriba de imports).
vi.hoisted(() => {
  process.env.STRIPE_PRICE_ID_BASE ??= "price_test_dummy";
  process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
  process.env.NEXT_PUBLIC_APP_URL ??= "https://test.example";
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service_role_dummy";
});

const mocks = vi.hoisted(() => ({
  getAdminClient: vi.fn(),
  inngestSend: vi.fn(),
}));

vi.mock("@/lib/db/admin", () => ({
  getAdminClient: mocks.getAdminClient,
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: mocks.inngestSend },
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({ checkout: { sessions: { list: vi.fn() } } }),
}));

import { handleCheckoutCompleted } from "@/lib/stripe/webhook";

// Thenable chain compatible con la cadena .from().select().eq()...
type ChainMock = Record<string, ReturnType<typeof vi.fn>> & {
  then: (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function makeChain<T>(result: T): ChainMock {
  const promise = Promise.resolve(result);
  const chain: ChainMock = {
    then: (onFulfilled, onRejected) =>
      promise.then(onFulfilled, onRejected) as Promise<unknown>,
  } as ChainMock;
  for (const m of ["select", "eq", "update", "insert", "single", "maybeSingle"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

const PURCHASE_ID = "00000000-0000-0000-0000-000000000aaa";
const USER_ID = "00000000-0000-0000-0000-000000000bbb";

function makeSession(): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    metadata: { purchase_id: PURCHASE_ID },
    client_reference_id: USER_ID,
    payment_intent: "pi_test_999",
    customer: "cus_test_777",
    amount_total: 5000,
    payment_status: "paid",
  } as unknown as Stripe.Checkout.Session;
}

let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  vi.clearAllMocks();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

describe("handleCheckoutCompleted — Inngest integration (F.4)", () => {
  it("emite evento purchase/paid con dedup id tras UPDATE exitoso", async () => {
    // lookup purchase: ownership match
    const lookupChain = makeChain({
      data: { user_id: USER_ID },
      error: null,
    });
    // update purchase: success
    const updateChain = makeChain({ error: null });

    mocks.getAdminClient.mockReturnValue({
      from: vi
        .fn()
        .mockReturnValueOnce(lookupChain)
        .mockReturnValueOnce(updateChain),
    });
    mocks.inngestSend.mockResolvedValue({ ids: ["evt_inngest_x"] });

    const result = await handleCheckoutCompleted(makeSession());

    expect(result).toEqual({ ok: true });
    expect(mocks.inngestSend).toHaveBeenCalledTimes(1);
    expect(mocks.inngestSend).toHaveBeenCalledWith({
      id: `purchase-paid-${PURCHASE_ID}`,
      name: "purchase/paid",
      data: { purchaseId: PURCHASE_ID, userId: USER_ID },
    });
  });

  it("NO emite evento si UPDATE falla (returns 500 antes del send)", async () => {
    const lookupChain = makeChain({
      data: { user_id: USER_ID },
      error: null,
    });
    const updateChain = makeChain({ error: { message: "db fried" } });

    mocks.getAdminClient.mockReturnValue({
      from: vi
        .fn()
        .mockReturnValueOnce(lookupChain)
        .mockReturnValueOnce(updateChain),
    });

    const result = await handleCheckoutCompleted(makeSession());

    expect(result.ok).toBe(false);
    expect(mocks.inngestSend).not.toHaveBeenCalled();
  });

  it("NO emite evento si ownership mismatch (ignored sin tocar DB ni Inngest)", async () => {
    const lookupChain = makeChain({
      data: { user_id: "OTHER_USER" },
      error: null,
    });

    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(lookupChain),
    });

    const result = await handleCheckoutCompleted(makeSession());

    expect(result).toEqual({ ok: true, ignored: true });
    expect(mocks.inngestSend).not.toHaveBeenCalled();
  });

  it("retorna ok:true aunque inngest.send falle (no rompe el webhook)", async () => {
    const lookupChain = makeChain({
      data: { user_id: USER_ID },
      error: null,
    });
    const updateChain = makeChain({ error: null });

    mocks.getAdminClient.mockReturnValue({
      from: vi
        .fn()
        .mockReturnValueOnce(lookupChain)
        .mockReturnValueOnce(updateChain),
    });
    mocks.inngestSend.mockRejectedValue(new Error("inngest cloud down"));

    const result = await handleCheckoutCompleted(makeSession());

    // El UPDATE ya fue exitoso — el webhook devuelve OK aunque
    // el evento no se haya enviado. Loggea el error a console.error.
    expect(result).toEqual({ ok: true });
    expect(errorSpy).toHaveBeenCalled();
    const errorArgs = errorSpy.mock.calls.flat().map(String).join(" ");
    expect(errorArgs).toMatch(/inngest cloud down/);
  });
});
