import { afterEach, describe, expect, it, vi } from "vitest";

import { detectDevice } from "@/lib/utils/device";

// vitest corre con environment "node" (vitest.config.ts) → window es
// undefined por default. Para los tests de UA stubeamos un window mínimo
// vía vi.stubGlobal. vi.unstubAllGlobals() en afterEach previene leak
// entre tests.

describe("detectDevice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'desktop' when window is undefined (SSR)", () => {
    // Sin stub: window queda undefined en el env node de vitest.
    expect(detectDevice()).toBe("desktop");
  });

  it("returns 'ios' for an iPhone user agent", () => {
    vi.stubGlobal("window", {
      navigator: {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });
    expect(detectDevice()).toBe("ios");
  });

  it("returns 'android' for an Android user agent", () => {
    vi.stubGlobal("window", {
      navigator: {
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 Chrome/119.0.0.0 Mobile Safari/537.36",
      },
    });
    expect(detectDevice()).toBe("android");
  });

  it("returns 'desktop' for a non-mobile user agent", () => {
    vi.stubGlobal("window", {
      navigator: {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
      },
    });
    expect(detectDevice()).toBe("desktop");
  });
});
