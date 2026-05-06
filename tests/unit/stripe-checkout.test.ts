import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Setup env ANTES del module load — config.ts hace requireEnv top-level.
vi.hoisted(() => {
  process.env.STRIPE_PRICE_ID_BASE ??= "price_test_dummy";
  process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
  process.env.NEXT_PUBLIC_APP_URL ??= "https://test.example";
});

const stripeMock = vi.hoisted(() => ({
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => stripeMock,
}));

import {
  createCheckoutSession,
  retrieveSessionUrl,
} from "@/lib/stripe/checkout";
import { STRIPE_PRICE_ID_BASE } from "@/lib/stripe/config";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createCheckoutSession()", () => {
  it("construye los args correctos al SDK y pasa idempotencyKey", async () => {
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_xyz",
      url: "https://checkout.stripe.com/x",
    });

    const result = await createCheckoutSession({
      userId: "u-123",
      purchaseId: "p-456",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe("https://checkout.stripe.com/x");
      expect(result.sessionId).toBe("cs_test_xyz");
    }

    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledOnce();
    const [args, opts] = stripeMock.checkout.sessions.create.mock.calls[0];
    expect(args.mode).toBe("payment");
    expect(args.line_items).toEqual([
      { price: STRIPE_PRICE_ID_BASE, quantity: 1 },
    ]);
    expect(args.client_reference_id).toBe("u-123");
    expect(args.metadata).toEqual({
      purchase_id: "p-456",
      user_id: "u-123",
    });
    expect(args.success_url).toBe(
      "https://test.example/analizando?session_id={CHECKOUT_SESSION_ID}",
    );
    expect(args.cancel_url).toBe("https://test.example/upload?canceled=1");
    expect(opts.idempotencyKey).toMatch(/^checkout_u-123_\d+$/);
  });

  it("granularidad del idempotencyKey es 1 minuto", async () => {
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: "cs_x",
      url: "https://x",
    });

    // Dos llamadas dentro del mismo minuto deben generar el mismo bucket.
    const fixedNow = new Date("2026-05-06T12:34:00Z").getTime();
    vi.setSystemTime(new Date(fixedNow));

    await createCheckoutSession({ userId: "u", purchaseId: "p1" });
    // 30s después — mismo minute bucket.
    vi.setSystemTime(new Date(fixedNow + 30_000));
    await createCheckoutSession({ userId: "u", purchaseId: "p2" });

    const [, opts1] = stripeMock.checkout.sessions.create.mock.calls[0];
    const [, opts2] = stripeMock.checkout.sessions.create.mock.calls[1];
    expect(opts1.idempotencyKey).toBe(opts2.idempotencyKey);

    // 90s después — minute bucket distinto.
    vi.setSystemTime(new Date(fixedNow + 90_000));
    await createCheckoutSession({ userId: "u", purchaseId: "p3" });
    const [, opts3] = stripeMock.checkout.sessions.create.mock.calls[2];
    expect(opts3.idempotencyKey).not.toBe(opts1.idempotencyKey);
  });

  it("retorna stripe_failed con message si Stripe lanza", async () => {
    stripeMock.checkout.sessions.create.mockRejectedValue(
      new Error("Stripe API down"),
    );
    const result = await createCheckoutSession({
      userId: "u",
      purchaseId: "p",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("stripe_failed");
      expect(result.message).toBe("Stripe API down");
    }
  });

  it("retorna stripe_failed si la session no tiene URL", async () => {
    stripeMock.checkout.sessions.create.mockResolvedValue({
      id: "cs_no_url",
      url: null,
    });
    const result = await createCheckoutSession({
      userId: "u",
      purchaseId: "p",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("stripe_failed");
    }
  });
});

describe("retrieveSessionUrl()", () => {
  it("retorna URL si la session está open", async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      status: "open",
      url: "https://checkout.stripe.com/recovered",
    });
    const url = await retrieveSessionUrl("cs_xyz");
    expect(url).toBe("https://checkout.stripe.com/recovered");
  });

  it("retorna null si la session está expired", async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      status: "expired",
      url: "https://x",
    });
    const url = await retrieveSessionUrl("cs_xyz");
    expect(url).toBeNull();
  });

  it("retorna null si la session está complete (ya pagada)", async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      status: "complete",
      url: "https://x",
    });
    const url = await retrieveSessionUrl("cs_xyz");
    expect(url).toBeNull();
  });

  it("retorna null defensivo si Stripe lanza", async () => {
    stripeMock.checkout.sessions.retrieve.mockRejectedValue(
      new Error("not found"),
    );
    const url = await retrieveSessionUrl("cs_xyz");
    expect(url).toBeNull();
  });
});
