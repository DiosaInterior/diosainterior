import { describe, expect, it } from "vitest";

import { generateEventId } from "@/lib/analytics/event-id";

// G.7.1 — generateEventId() usa globalThis.crypto.randomUUID(),
// disponible en Node 19+ (donde corre vitest) y en browsers modernos
// (Safari 15.4+, Chrome 92+, Firefox 95+). El test valida formato y
// randomness; la portabilidad browser se valida visualmente con un
// smoke test en producción (no hay env "browser" en este vitest).

describe("generateEventId", () => {
  it("retorna UUID v4 con formato canónico", () => {
    const id = generateEventId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("dos llamadas devuelven IDs distintos (randomness)", () => {
    expect(generateEventId()).not.toBe(generateEventId());
  });
});
