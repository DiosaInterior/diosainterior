import { describe, expect, it } from "vitest";

import { eventIdFromPurchase, generateEventId } from "@/lib/analytics/event-id";

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

describe("eventIdFromPurchase", () => {
  const PURCHASE_ID = "9db6760a-5582-49af-87bb-3afcff3b0095";

  it("retorna hash hex de 32 chars", () => {
    const id = eventIdFromPurchase(PURCHASE_ID);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("es determinístico: misma purchase_id → mismo eventId", () => {
    expect(eventIdFromPurchase(PURCHASE_ID)).toBe(
      eventIdFromPurchase(PURCHASE_ID),
    );
  });

  it("purchase_ids distintos → eventIds distintos", () => {
    expect(eventIdFromPurchase(PURCHASE_ID)).not.toBe(
      eventIdFromPurchase("otro-purchase-id"),
    );
  });

  it("suffix distinto → eventId distinto (evita colisión Purchase vs CompleteRegistration)", () => {
    const purchase = eventIdFromPurchase(PURCHASE_ID);
    const registration = eventIdFromPurchase(PURCHASE_ID, "registration");
    expect(purchase).not.toBe(registration);
  });

  it("suffix idéntico → eventId idéntico (idempotencia con suffix)", () => {
    expect(eventIdFromPurchase(PURCHASE_ID, "registration")).toBe(
      eventIdFromPurchase(PURCHASE_ID, "registration"),
    );
  });
});
