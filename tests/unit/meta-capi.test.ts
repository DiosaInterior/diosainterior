import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

// Mock Sentry before importing meta-capi — meta-capi importa
// @sentry/nextjs y queremos capturar las llamadas a captureException
// para los tests de error path.
const captureExceptionMock = vi.hoisted(() => vi.fn());
vi.mock("@sentry/nextjs", () => ({
  captureException: captureExceptionMock,
}));

import { sendCapiEvent } from "@/lib/analytics/meta-capi";

const ORIGINAL_ENV = { ...process.env };

let fetchMock: MockInstance<typeof fetch>;

beforeEach(() => {
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "TEST_PIXEL_123";
  process.env.META_CAPI_ACCESS_TOKEN = "TEST_TOKEN_XYZ";
  delete process.env.META_TEST_EVENT_CODE;
  captureExceptionMock.mockReset();
  fetchMock = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  fetchMock.mockRestore();
  process.env = { ...ORIGINAL_ENV };
});

function mockFetchOk() {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ events_received: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function mockFetchHttpError(status: number) {
  // mockImplementation (no mockResolvedValue) para generar UNA Response
  // fresca por attempt — sino el retry intentaría re-leer un body ya
  // consumido y rompería con "Body is unusable".
  fetchMock.mockImplementation(() =>
    Promise.resolve(new Response("server error", { status })),
  );
}

describe("sendCapiEvent — happy path", () => {
  it("POST a graph.facebook.com con payload correcto", async () => {
    mockFetchOk();

    await sendCapiEvent({
      eventName: "Purchase",
      eventId: "evt-purchase-1",
      userData: { email: "alice@example.com" },
      customData: { value: 499, currency: "MXN" },
      eventSourceUrl: "https://diosainterior.app/upload",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("graph.facebook.com");
    expect(url).toContain("TEST_PIXEL_123/events");
    expect(url).toContain("access_token=TEST_TOKEN_XYZ");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].event_name).toBe("Purchase");
    expect(body.data[0].event_id).toBe("evt-purchase-1");
    expect(body.data[0].action_source).toBe("website");
    expect(body.data[0].event_source_url).toBe(
      "https://diosainterior.app/upload",
    );
    expect(body.data[0].custom_data).toEqual({ value: 499, currency: "MXN" });
    expect(body.test_event_code).toBeUndefined();
  });

  it("hashea email con SHA-256 lowercase antes de enviar", async () => {
    mockFetchOk();

    await sendCapiEvent({
      eventName: "Lead",
      eventId: "evt-lead-1",
      userData: { email: "Alice@Example.com" }, // mixed case
      eventSourceUrl: "https://diosainterior.app/auth/callback",
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    // SHA-256 de "alice@example.com" (lowercase trimmed)
    expect(body.data[0].user_data.em).toMatch(/^[0-9a-f]{64}$/);
    expect(body.data[0].user_data.em).not.toContain("alice"); // hashed, not raw
  });

  it("propaga client_ip_address y client_user_agent sin hashear", async () => {
    mockFetchOk();

    await sendCapiEvent({
      eventName: "Lead",
      eventId: "evt-lead-2",
      userData: {
        email: "x@y.com",
        client_ip_address: "203.0.113.42",
        client_user_agent: "Mozilla/5.0 Test",
      },
      eventSourceUrl: "https://diosainterior.app/",
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.data[0].user_data.client_ip_address).toBe("203.0.113.42");
    expect(body.data[0].user_data.client_user_agent).toBe("Mozilla/5.0 Test");
  });

  it("incluye test_event_code cuando META_TEST_EVENT_CODE está seteado", async () => {
    process.env.META_TEST_EVENT_CODE = "TEST5678";
    mockFetchOk();

    await sendCapiEvent({
      eventName: "Purchase",
      eventId: "evt-test",
      userData: { email: "z@y.com" },
      eventSourceUrl: "https://diosainterior.app/upload",
    });

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.test_event_code).toBe("TEST5678");
  });
});

describe("sendCapiEvent — no-op cuando config falta", () => {
  it("no llama fetch si NEXT_PUBLIC_META_PIXEL_ID falta", async () => {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;

    await sendCapiEvent({
      eventName: "Lead",
      eventId: "evt-x",
      userData: { email: "a@b.com" },
      eventSourceUrl: "https://x.com",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("no llama fetch si META_CAPI_ACCESS_TOKEN falta", async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;

    await sendCapiEvent({
      eventName: "Lead",
      eventId: "evt-x",
      userData: { email: "a@b.com" },
      eventSourceUrl: "https://x.com",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });
});

describe("sendCapiEvent — retry + error handling", () => {
  it("hace 1 reintento si el primer attempt falla con HTTP 5xx, succeeded en el 2do", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("transient", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ events_received: 1 }), { status: 200 }),
      );

    await sendCapiEvent({
      eventName: "Purchase",
      eventId: "evt-retry",
      userData: { email: "a@b.com" },
      eventSourceUrl: "https://diosainterior.app/upload",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("loguea a Sentry con tag 'capi:meta' si ambos attempts fallan con HTTP error", async () => {
    mockFetchHttpError(503);

    await sendCapiEvent({
      eventName: "Purchase",
      eventId: "evt-fail",
      userData: { email: "a@b.com" },
      eventSourceUrl: "https://diosainterior.app/upload",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 + 1 retry
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [err, ctx] = captureExceptionMock.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("503");
    expect(ctx).toMatchObject({
      tags: { capi: "meta", event_name: "Purchase" },
      extra: expect.objectContaining({ event_id: "evt-fail" }),
    });
  });

  it("loguea a Sentry si fetch lanza (red caída)", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await sendCapiEvent({
      eventName: "Lead",
      eventId: "evt-network",
      userData: { email: "a@b.com" },
      eventSourceUrl: "https://diosainterior.app/",
    });

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [err] = captureExceptionMock.mock.calls[0];
    expect((err as Error).message).toBe("ECONNREFUSED");
  });

  it("nunca lanza al caller — sendCapiEvent es fire-and-forget safe", async () => {
    mockFetchHttpError(500);

    await expect(
      sendCapiEvent({
        eventName: "Purchase",
        eventId: "evt-no-throw",
        userData: { email: "a@b.com" },
        eventSourceUrl: "https://x.com",
      }),
    ).resolves.toBeUndefined();
  });
});
