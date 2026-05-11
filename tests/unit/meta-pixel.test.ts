import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackEvent } from "@/lib/analytics/meta-pixel";

// vitest corre con environment 'node' → window es undefined por default.
// Para testar trackEvent en modo "browser" stubeamos window con un fbq mock.

describe("trackEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("es no-op en SSR (window undefined)", () => {
    // Sin stub de window → typeof window === 'undefined' en el env de node.
    expect(() => trackEvent("PageView")).not.toThrow();
  });

  it("es no-op si fbq no está cargado (ad-blocker, slow net)", () => {
    vi.stubGlobal("window", { fbq: undefined });
    expect(() => trackEvent("ViewContent", { content_name: "landing" })).not.toThrow();
  });

  it("llama fbq('track', eventName, params) cuando fbq existe y NO se pasa eventId", () => {
    const fbqMock = vi.fn();
    vi.stubGlobal("window", { fbq: fbqMock });

    trackEvent("ViewContent", { content_name: "landing" });

    expect(fbqMock).toHaveBeenCalledTimes(1);
    expect(fbqMock).toHaveBeenCalledWith("track", "ViewContent", {
      content_name: "landing",
    });
  });

  it("llama fbq con options.eventID cuando se pasa eventId (deduplicación CAPI)", () => {
    const fbqMock = vi.fn();
    vi.stubGlobal("window", { fbq: fbqMock });

    trackEvent(
      "InitiateCheckout",
      { value: 499, currency: "MXN" },
      "abc-event-123",
    );

    expect(fbqMock).toHaveBeenCalledWith(
      "track",
      "InitiateCheckout",
      { value: 499, currency: "MXN" },
      { eventID: "abc-event-123" },
    );
  });

  it("acepta llamada sin params (solo eventName)", () => {
    const fbqMock = vi.fn();
    vi.stubGlobal("window", { fbq: fbqMock });

    trackEvent("PageView");

    expect(fbqMock).toHaveBeenCalledWith("track", "PageView", undefined);
  });
});

describe("trackEvent — defensive", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { fbq: undefined });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trackEvent en multiple eventos con fbq missing no acumula errores", () => {
    expect(() => {
      trackEvent("PageView");
      trackEvent("ViewContent");
      trackEvent("Lead");
      trackEvent("InitiateCheckout", { value: 499 });
      trackEvent("Purchase", { value: 499 }, "evt-1");
      trackEvent("CompleteRegistration");
    }).not.toThrow();
  });
});
