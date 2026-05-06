import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.STRIPE_PRICE_ID_BASE ??= "price_test_dummy";
  process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_test_dummy";
  process.env.NEXT_PUBLIC_APP_URL ??= "https://test.example";
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service_role_dummy";
});

const stripeMock = vi.hoisted(() => ({
  webhooks: {
    constructEvent: vi.fn(),
  },
}));

const mocks = vi.hoisted(() => ({
  getAdminClient: vi.fn(),
  handleStripeEvent: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => stripeMock,
}));

vi.mock("@/lib/db/admin", () => ({
  getAdminClient: mocks.getAdminClient,
}));

vi.mock("@/lib/stripe/webhook", () => ({
  handleStripeEvent: mocks.handleStripeEvent,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

// Chain mock thenable — mismo patrón que api-checkout.
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
    "gte",
    "lt",
    "order",
    "limit",
    "insert",
    "update",
    "upsert",
    "delete",
    "single",
    "maybeSingle",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function buildRequest(body: string, signature: string | null): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (signature !== null) headers["stripe-signature"] = signature;
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/webhooks/stripe", () => {
  it("retorna 400 missing_signature si falta el header", async () => {
    const res = await POST(buildRequest("{}", null));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "missing_signature",
    });
    expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("retorna 400 invalid_signature si constructEvent lanza", async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(buildRequest("{}", "t=123,v1=fake"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "invalid_signature",
    });
    expect(mocks.getAdminClient).not.toHaveBeenCalled();
    expect(mocks.handleStripeEvent).not.toHaveBeenCalled();
  });

  it("retorna 200 duplicate si webhook_events ya tiene el id", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const eventsChain = makeChain({ data: [], error: null }); // upsert ignored
    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(eventsChain),
    });

    const res = await POST(buildRequest("{}", "sig"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, duplicate: true });
    expect(mocks.handleStripeEvent).not.toHaveBeenCalled();
  });

  it("retorna 200 + invoca handleStripeEvent en evento nuevo", async () => {
    const fakeEvent = {
      id: "evt_new",
      type: "checkout.session.completed",
      data: { object: { id: "cs_x" } },
    };
    stripeMock.webhooks.constructEvent.mockReturnValue(fakeEvent);
    const eventsChain = makeChain({
      data: [{ id: "evt_new" }],
      error: null,
    });
    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(eventsChain),
    });
    mocks.handleStripeEvent.mockResolvedValue({ ok: true });

    const res = await POST(buildRequest("{}", "sig"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.handleStripeEvent).toHaveBeenCalledOnce();
    expect(mocks.handleStripeEvent).toHaveBeenCalledWith(fakeEvent);
  });

  it("retorna 200 + ok si el handler ignora el evento (ignored:true)", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: "evt_unknown",
      type: "customer.subscription.updated",
      data: { object: {} },
    });
    const eventsChain = makeChain({
      data: [{ id: "evt_unknown" }],
      error: null,
    });
    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(eventsChain),
    });
    mocks.handleStripeEvent.mockResolvedValue({ ok: true, ignored: true });

    const res = await POST(buildRequest("{}", "sig"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("retorna 500 si handleStripeEvent falla (Stripe reintenta)", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: "evt_err",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const eventsChain = makeChain({
      data: [{ id: "evt_err" }],
      error: null,
    });
    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(eventsChain),
    });
    mocks.handleStripeEvent.mockResolvedValue({
      ok: false,
      error: "db_update_failed: connection lost",
    });

    const res = await POST(buildRequest("{}", "sig"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/db_update_failed/);
  });

  it("retorna 500 db_failed si la persistencia de webhook_events truena", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: "evt_x",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const eventsChain = makeChain({
      data: null,
      error: { message: "supabase down" },
    });
    mocks.getAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(eventsChain),
    });

    const res = await POST(buildRequest("{}", "sig"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("db_failed");
    expect(mocks.handleStripeEvent).not.toHaveBeenCalled();
  });
});
