import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.hoisted(() => {
  process.env.STRIPE_PRICE_ID_BASE ??= "price_test_dummy";
  process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
  process.env.NEXT_PUBLIC_APP_URL ??= "https://test.example";
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service_role_dummy";
});

const stripeMock = vi.hoisted(() => ({
  checkout: {
    sessions: {
      list: vi.fn(),
    },
  },
}));

const mocks = vi.hoisted(() => ({
  getAdminClient: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => stripeMock,
}));

vi.mock("@/lib/db/admin", () => ({
  getAdminClient: mocks.getAdminClient,
}));

import {
  handleCheckoutCompleted,
  handlePaymentFailed,
  handleStripeEvent,
} from "@/lib/stripe/webhook";

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
  for (const m of [
    "select",
    "eq",
    "update",
    "insert",
    "single",
    "maybeSingle",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------
// handleStripeEvent — dispatcher
// ---------------------------------------------------------------------

describe("handleStripeEvent()", () => {
  it("ignora event types desconocidos con ok:true ignored:true", async () => {
    const result = await handleStripeEvent({
      id: "evt_x",
      type: "customer.created",
      data: { object: {} },
    } as unknown as Stripe.Event);
    expect(result).toEqual({ ok: true, ignored: true });
    expect(mocks.getAdminClient).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------
// handleCheckoutCompleted
// ---------------------------------------------------------------------

const fakeSession = (
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session =>
  ({
    id: "cs_test_xyz",
    metadata: { purchase_id: "p-1", user_id: "u-1" },
    client_reference_id: "u-1",
    payment_intent: "pi_abc",
    customer: "cus_xyz",
    amount_total: 49900,
    payment_status: "paid",
    ...overrides,
  }) as unknown as Stripe.Checkout.Session;

describe("handleCheckoutCompleted()", () => {
  it("ignora si falta metadata.purchase_id", async () => {
    const result = await handleCheckoutCompleted(
      fakeSession({ metadata: {} }),
    );
    expect(result).toEqual({ ok: true, ignored: true });
    expect(mocks.getAdminClient).not.toHaveBeenCalled();
  });

  it("ignora si falta client_reference_id", async () => {
    const result = await handleCheckoutCompleted(
      fakeSession({ client_reference_id: null }),
    );
    expect(result).toEqual({ ok: true, ignored: true });
    expect(mocks.getAdminClient).not.toHaveBeenCalled();
  });

  it("ignora si la purchase no existe", async () => {
    const lookupChain = makeChain({ data: null, error: null });
    const fromMock = vi.fn().mockReturnValue(lookupChain);
    mocks.getAdminClient.mockReturnValue({ from: fromMock });

    const result = await handleCheckoutCompleted(fakeSession());
    expect(result).toEqual({ ok: true, ignored: true });
    // Sólo lookup, no update.
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("ignora si user_id no matchea (ownership tampering)", async () => {
    const lookupChain = makeChain({
      data: { user_id: "u-OTHER" },
      error: null,
    });
    const fromMock = vi.fn().mockReturnValue(lookupChain);
    mocks.getAdminClient.mockReturnValue({ from: fromMock });

    const result = await handleCheckoutCompleted(fakeSession());
    expect(result).toEqual({ ok: true, ignored: true });
    // No se llama UPDATE.
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("happy path: UPDATE con status=paid + paid_at + amount_total", async () => {
    const lookupChain = makeChain({
      data: { user_id: "u-1" },
      error: null,
    });
    const updateChain = makeChain({ error: null });
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(lookupChain); // SELECT user_id
    fromMock.mockReturnValueOnce(updateChain); // UPDATE
    mocks.getAdminClient.mockReturnValue({ from: fromMock });

    const result = await handleCheckoutCompleted(fakeSession());
    expect(result).toEqual({ ok: true });

    // Verificar el UPDATE
    expect(updateChain.update).toHaveBeenCalledOnce();
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.status).toBe("paid");
    expect(updateArg.amount_cents).toBe(49900);
    expect(updateArg.stripe_payment_intent).toBe("pi_abc");
    expect(updateArg.stripe_customer_id).toBe("cus_xyz");
    expect(typeof updateArg.paid_at).toBe("string");
    expect(updateArg.metadata.stripe_session_id).toBe("cs_test_xyz");

    // Idempotencia secundaria: WHERE id=purchaseId AND status='pending'
    expect(updateChain.eq).toHaveBeenCalledWith("id", "p-1");
    expect(updateChain.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("retorna error si el UPDATE falla", async () => {
    const lookupChain = makeChain({
      data: { user_id: "u-1" },
      error: null,
    });
    const updateChain = makeChain({
      error: { message: "constraint violation" },
    });
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(lookupChain);
    fromMock.mockReturnValueOnce(updateChain);
    mocks.getAdminClient.mockReturnValue({ from: fromMock });

    const result = await handleCheckoutCompleted(fakeSession());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/db_update_failed/);
    }
  });
});

// ---------------------------------------------------------------------
// handlePaymentFailed
// ---------------------------------------------------------------------

const fakeIntent = (
  overrides: Partial<Stripe.PaymentIntent> = {},
): Stripe.PaymentIntent =>
  ({
    id: "pi_failed",
    last_payment_error: {
      code: "card_declined",
      decline_code: "insufficient_funds",
      message: "Your card was declined.",
    },
    ...overrides,
  }) as unknown as Stripe.PaymentIntent;

describe("handlePaymentFailed()", () => {
  it("ignora si no hay session asociada al payment_intent", async () => {
    stripeMock.checkout.sessions.list.mockResolvedValue({ data: [] });

    const result = await handlePaymentFailed(fakeIntent());
    expect(result).toEqual({ ok: true, ignored: true });
    expect(mocks.getAdminClient).not.toHaveBeenCalled();
  });

  it("ignora si la session no tiene metadata.purchase_id", async () => {
    stripeMock.checkout.sessions.list.mockResolvedValue({
      data: [
        {
          id: "cs_x",
          metadata: {},
          client_reference_id: "u-1",
        },
      ],
    });

    const result = await handlePaymentFailed(fakeIntent());
    expect(result).toEqual({ ok: true, ignored: true });
    expect(mocks.getAdminClient).not.toHaveBeenCalled();
  });

  it("ignora si user_id no matchea (ownership tampering)", async () => {
    stripeMock.checkout.sessions.list.mockResolvedValue({
      data: [
        {
          id: "cs_x",
          metadata: { purchase_id: "p-1" },
          client_reference_id: "u-1",
        },
      ],
    });
    const lookupChain = makeChain({
      data: { user_id: "u-OTHER" },
      error: null,
    });
    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(lookupChain),
    });

    const result = await handlePaymentFailed(fakeIntent());
    expect(result).toEqual({ ok: true, ignored: true });
  });

  it("happy path: UPDATE con status=failed + last_payment_error", async () => {
    stripeMock.checkout.sessions.list.mockResolvedValue({
      data: [
        {
          id: "cs_xyz",
          metadata: { purchase_id: "p-1" },
          client_reference_id: "u-1",
        },
      ],
    });
    const lookupChain = makeChain({
      data: { user_id: "u-1" },
      error: null,
    });
    const updateChain = makeChain({ error: null });
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(lookupChain);
    fromMock.mockReturnValueOnce(updateChain);
    mocks.getAdminClient.mockReturnValue({ from: fromMock });

    const result = await handlePaymentFailed(fakeIntent());
    expect(result).toEqual({ ok: true });

    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.status).toBe("failed");
    expect(updateArg.stripe_payment_intent).toBe("pi_failed");
    expect(updateArg.metadata.stripe_session_id).toBe("cs_xyz");
    expect(updateArg.metadata.last_payment_error.code).toBe("card_declined");
    expect(updateArg.metadata.last_payment_error.decline_code).toBe(
      "insufficient_funds",
    );

    // Idempotencia secundaria: WHERE status='pending'
    expect(updateChain.eq).toHaveBeenCalledWith("status", "pending");
  });
});
