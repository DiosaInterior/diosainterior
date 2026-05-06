import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

// Env vars antes del module load — config.ts hace requireEnv top-level.
vi.hoisted(() => {
  process.env.STRIPE_PRICE_ID_BASE ??= "price_test_dummy";
  process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
  process.env.NEXT_PUBLIC_APP_URL ??= "https://test.example";
});

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
  createCheckoutSession: vi.fn(),
  retrieveSessionUrl: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getUser: mocks.getUser,
  requireUser: vi.fn(),
}));

vi.mock("@/lib/db/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/stripe/checkout", () => ({
  createCheckoutSession: mocks.createCheckoutSession,
  retrieveSessionUrl: mocks.retrieveSessionUrl,
}));

import { POST } from "@/app/api/checkout/create-session/route";

const fakeUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "ana@example.com",
} as unknown as User;

// Chain mock thenable: cada método devuelve la misma chain (chainable),
// y la chain misma es awaitable y resuelve al `result` configurado.
// Permite reproducir cualquier secuencia .from(...).select().eq().limit()
// sin importar dónde caiga el await terminal — siempre devuelve lo mismo.
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
    "delete",
    "single",
    "maybeSingle",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue(fakeUser);
});

describe("POST /api/checkout/create-session", () => {
  it("retorna 401 unauthenticated si no hay sesión", async () => {
    mocks.getUser.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "unauthenticated" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("retorna 400 no_photos si la usuaria no tiene fotos", async () => {
    const fromMock = vi
      .fn()
      .mockReturnValue(makeChain({ count: 0, error: null }));
    mocks.createClient.mockResolvedValue({ from: fromMock });

    const res = await POST();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "no_photos" });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("retorna 400 incomplete_photos si tiene <4 fotos", async () => {
    const fromMock = vi
      .fn()
      .mockReturnValue(makeChain({ count: 2, error: null }));
    mocks.createClient.mockResolvedValue({ from: fromMock });

    const res = await POST();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "incomplete_photos",
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("retorna 500 db_failed si el count de fotos falla", async () => {
    const fromMock = vi.fn().mockReturnValue(
      makeChain({
        count: null,
        error: { message: "db connection lost" },
      }),
    );
    mocks.createClient.mockResolvedValue({ from: fromMock });

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("db_failed");
  });

  it("recupera URL de pending reciente si Stripe la confirma open", async () => {
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(makeChain({ count: 4, error: null })); // photos count
    fromMock.mockReturnValueOnce(
      makeChain({
        data: [{ id: "p-old", stripe_session_id: "cs_old" }],
        error: null,
      }),
    ); // pending lookup
    mocks.createClient.mockResolvedValue({ from: fromMock });
    mocks.retrieveSessionUrl.mockResolvedValue("https://recovered.url");

    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      url: "https://recovered.url",
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("happy path: 4 fotos, sin pending, crea purchase + session", async () => {
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(makeChain({ count: 4, error: null })); // photos count
    fromMock.mockReturnValueOnce(makeChain({ data: [], error: null })); // pending (vacío)
    fromMock.mockReturnValueOnce(makeChain({ error: null })); // cleanup update
    fromMock.mockReturnValueOnce(
      makeChain({ data: { id: "new-purchase" }, error: null }),
    ); // insert
    fromMock.mockReturnValueOnce(makeChain({ error: null })); // final update con session_id
    mocks.createClient.mockResolvedValue({ from: fromMock });
    mocks.createCheckoutSession.mockResolvedValue({
      ok: true,
      url: "https://checkout.stripe.com/new",
      sessionId: "cs_new_123",
    });

    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      url: "https://checkout.stripe.com/new",
    });
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
      userId: fakeUser.id,
      purchaseId: "new-purchase",
    });
  });

  it("marca purchase como failed y retorna 500 si Stripe falla", async () => {
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(makeChain({ count: 4, error: null }));
    fromMock.mockReturnValueOnce(makeChain({ data: [], error: null }));
    fromMock.mockReturnValueOnce(makeChain({ error: null }));
    fromMock.mockReturnValueOnce(
      makeChain({ data: { id: "new-purchase" }, error: null }),
    );
    fromMock.mockReturnValueOnce(makeChain({ error: null })); // mark failed
    mocks.createClient.mockResolvedValue({ from: fromMock });
    mocks.createCheckoutSession.mockResolvedValue({
      ok: false,
      error: "stripe_failed",
      message: "Stripe API timeout",
    });

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("stripe_failed");
    expect(body.message).toBe("Stripe API timeout");
  });

  it("retorna 500 db_failed si el INSERT del purchase falla", async () => {
    const fromMock = vi.fn();
    fromMock.mockReturnValueOnce(makeChain({ count: 4, error: null }));
    fromMock.mockReturnValueOnce(makeChain({ data: [], error: null }));
    fromMock.mockReturnValueOnce(makeChain({ error: null }));
    fromMock.mockReturnValueOnce(
      makeChain({
        data: null,
        error: { message: "constraint violation" },
      }),
    );
    mocks.createClient.mockResolvedValue({ from: fromMock });

    const res = await POST();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("db_failed");
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });
});
