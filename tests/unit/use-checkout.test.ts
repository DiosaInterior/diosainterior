import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { performCheckout } from "@/components/upload/useCheckout";

beforeEach(() => {
  // performCheckout usa window.location.href en happy path. En vitest
  // node env no hay window — lo stubbeamos como objeto plano writable.
  vi.stubGlobal("window", { location: { href: "" } });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

function setupFetch(
  response: { ok: true; url: string } | { ok: false; error: string } | "throw",
) {
  const fetchMock = vi.fn();
  if (response === "throw") {
    fetchMock.mockRejectedValue(new TypeError("Network error"));
  } else {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue(response),
    });
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("performCheckout()", () => {
  it("happy path: setLoading(true) y window.location.href = url de Stripe", async () => {
    setupFetch({ ok: true, url: "https://checkout.stripe.com/abc" });
    const setLoading = vi.fn();
    const toast = vi.fn();
    const pushPath = vi.fn();

    await performCheckout({ toast, pushPath, setLoading });

    expect(setLoading).toHaveBeenCalledWith(true);
    // No setLoading(false) — la página se va a recargar al redirect.
    expect(setLoading).not.toHaveBeenCalledWith(false);
    expect(window.location.href).toBe("https://checkout.stripe.com/abc");
    expect(toast).not.toHaveBeenCalled();
    expect(pushPath).not.toHaveBeenCalled();
  });

  it("error de red (fetch throw): toast 'Error de red' + setLoading(false)", async () => {
    setupFetch("throw");
    const setLoading = vi.fn();
    const toast = vi.fn();
    const pushPath = vi.fn();

    await performCheckout({ toast, pushPath, setLoading });

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
    expect(toast).toHaveBeenCalledWith("Error de red. Intenta de nuevo.");
    expect(pushPath).not.toHaveBeenCalled();
  });

  it("no_photos: toast correcto + setLoading(false) + sin redirect", async () => {
    setupFetch({ ok: false, error: "no_photos" });
    const setLoading = vi.fn();
    const toast = vi.fn();
    const pushPath = vi.fn();

    await performCheckout({ toast, pushPath, setLoading });

    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(toast).toHaveBeenCalledWith("Subí tus 4 fotos primero");
    expect(pushPath).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
  });

  it("incomplete_photos: toast correcto", async () => {
    setupFetch({ ok: false, error: "incomplete_photos" });
    const setLoading = vi.fn();
    const toast = vi.fn();
    await performCheckout({ toast, pushPath: vi.fn(), setLoading });
    expect(toast).toHaveBeenCalledWith("Te faltan fotos para continuar");
  });

  it("stripe_failed: toast correcto", async () => {
    setupFetch({ ok: false, error: "stripe_failed" });
    const setLoading = vi.fn();
    const toast = vi.fn();
    await performCheckout({ toast, pushPath: vi.fn(), setLoading });
    expect(toast).toHaveBeenCalledWith(
      "Error al iniciar el pago. Intenta de nuevo.",
    );
  });

  it("db_failed: toast correcto", async () => {
    setupFetch({ ok: false, error: "db_failed" });
    const setLoading = vi.fn();
    const toast = vi.fn();
    await performCheckout({ toast, pushPath: vi.fn(), setLoading });
    expect(toast).toHaveBeenCalledWith("Error temporal. Intenta de nuevo.");
  });

  it("unauthenticated: toast + push('/login') después de 800ms", async () => {
    setupFetch({ ok: false, error: "unauthenticated" });
    const setLoading = vi.fn();
    const toast = vi.fn();
    const pushPath = vi.fn();

    await performCheckout({ toast, pushPath, setLoading });

    expect(toast).toHaveBeenCalledWith("Sesión expirada. Volvemos al login.");
    expect(pushPath).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(pushPath).toHaveBeenCalledWith("/login");
  });
});
