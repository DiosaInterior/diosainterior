// Tests de los helpers en lib/stripe/config.ts.
// El módulo lee STRIPE_PRICE_ID_BASE al boot y lanza si falta — por eso
// setteamos el env a un valor dummy ANTES del primer import. Cada test
// que necesite un STRIPE_SECRET_KEY distinto usa vi.stubEnv per-case.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted corre ANTES de los imports estáticos (que ESM hoistea
// arriba). Sin esto, lib/stripe/config.ts crashearía al cargar porque
// requireEnv("STRIPE_PRICE_ID_BASE") lanzaría con la env vacía.
vi.hoisted(() => {
  process.env.STRIPE_PRICE_ID_BASE ??= "price_test_dummy";
  process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy_for_module_load";
});

import { getStripeMode, isTestMode } from "@/lib/stripe/config";

const ORIGINAL_KEY = process.env.STRIPE_SECRET_KEY;

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  if (ORIGINAL_KEY === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = ORIGINAL_KEY;
  }
});

describe("isTestMode()", () => {
  it("true cuando STRIPE_SECRET_KEY empieza con sk_test_", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc123");
    expect(isTestMode()).toBe(true);
  });

  it("false cuando STRIPE_SECRET_KEY empieza con sk_live_", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc123");
    expect(isTestMode()).toBe(false);
  });

  it("false cuando STRIPE_SECRET_KEY no está", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(isTestMode()).toBe(false);
  });
});

describe("getStripeMode()", () => {
  it("retorna 'test' para sk_test_...", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc123");
    expect(getStripeMode()).toBe("test");
  });

  it("retorna 'live' para sk_live_...", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc123");
    expect(getStripeMode()).toBe("live");
  });

  it("lanza si STRIPE_SECRET_KEY no está", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(() => getStripeMode()).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("lanza para keys con prefix raro (ej. 'foo_bar')", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "foo_bar");
    expect(() => getStripeMode()).toThrow(/unexpected prefix/);
  });
});
