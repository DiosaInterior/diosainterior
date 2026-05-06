// Tests del lazy singleton getStripe(). El test "throws si missing"
// debe correr ANTES (o aislado de) los tests que crean instancia,
// porque una vez cacheada, getStripe lee env primero pero podría
// re-throw correctamente si la borramos. Verificamos ambos caminos.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

// STRIPE_PRICE_ID_BASE no es importada por client.ts, pero por defensa
// la setteamos por si una import transitiva o un setup global del
// proyecto la necesita.
const ORIGINAL_KEY = process.env.STRIPE_SECRET_KEY;

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_baseline_for_each");
});

afterEach(() => {
  vi.unstubAllEnvs();
  if (ORIGINAL_KEY === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = ORIGINAL_KEY;
  }
});

describe("getStripe()", () => {
  it("retorna una instancia de Stripe con sk_test_...", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc123");
    // Importación dinámica para que el módulo lea el env stubbed.
    // resetModules antes para que el cache singleton del módulo no
    // contamine entre tests.
    vi.resetModules();
    const { getStripe } = await import("@/lib/stripe/client");
    const instance = getStripe();
    expect(instance).toBeInstanceOf(Stripe);
  });

  it("reutiliza la misma instancia entre llamadas (singleton)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_singleton_check");
    vi.resetModules();
    const { getStripe } = await import("@/lib/stripe/client");
    const a = getStripe();
    const b = getStripe();
    expect(a).toBe(b);
  });

  it("lanza error claro si STRIPE_SECRET_KEY no está", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.resetModules();
    const { getStripe } = await import("@/lib/stripe/client");
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/);
  });
});
