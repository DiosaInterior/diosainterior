import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const storageFromMock = vi.fn();

vi.mock("@/lib/db/admin", () => ({
  getAdminClient: () => ({
    from: fromMock,
    storage: { from: storageFromMock },
  }),
}));

import { loadPhotosForUser } from "@/lib/storage/photos-loader";

// .from(table).select(cols).eq(col, val).order(col, opts) → Promise<{data,error}>
function chainSelectEqOrder(resolveValue: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolveValue),
  };
}

const FAKE_BYTES = Buffer.from("fake-image-bytes");
const FAKE_BASE64 = FAKE_BYTES.toString("base64");

function makeBlob(): Blob {
  return new Blob([new Uint8Array(FAKE_BYTES)]);
}

beforeEach(() => {
  fromMock.mockReset();
  storageFromMock.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadPhotosForUser — happy path", () => {
  it("returns 4 base64 photos with mediaType derived from extension", async () => {
    const photoRows = [
      { storage_path: "uid/1.jpg", position: 1 },
      { storage_path: "uid/2.png", position: 2 },
      { storage_path: "uid/3.webp", position: 3 },
      { storage_path: "uid/4", position: 4 }, // no extension → default jpeg
    ];
    fromMock.mockReturnValue(
      chainSelectEqOrder({ data: photoRows, error: null }),
    );

    const downloadMock = vi.fn().mockResolvedValue({
      data: makeBlob(),
      error: null,
    });
    storageFromMock.mockReturnValue({ download: downloadMock });

    const result = await loadPhotosForUser("uid");

    expect(result).toHaveLength(4);
    expect(result.map((p) => p.mediaType)).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpeg",
    ]);
    expect(result.map((p) => p.position)).toEqual([1, 2, 3, 4]);
    for (const p of result) {
      expect(p.data).toBe(FAKE_BASE64);
    }
    expect(downloadMock).toHaveBeenCalledTimes(4);
    expect(storageFromMock).toHaveBeenCalledWith("photos");
  });
});

describe("loadPhotosForUser — failure paths", () => {
  it("throws when DB query returns error", async () => {
    fromMock.mockReturnValue(
      chainSelectEqOrder({
        data: null,
        error: { message: "rls denied" },
      }),
    );
    await expect(loadPhotosForUser("uid")).rejects.toThrow(/rls denied/);
  });

  it("throws 'Expected 4 photos, got N' when fewer than 4 rows", async () => {
    fromMock.mockReturnValue(
      chainSelectEqOrder({
        data: [{ storage_path: "uid/1.jpg", position: 1 }],
        error: null,
      }),
    );
    await expect(loadPhotosForUser("uid")).rejects.toThrow(
      /Expected 4 photos.*got 1/,
    );
  });

  it("throws 'got 0' when zero rows", async () => {
    fromMock.mockReturnValue(chainSelectEqOrder({ data: [], error: null }));
    await expect(loadPhotosForUser("uid")).rejects.toThrow(/got 0/);
  });

  it("throws when storage download fails", async () => {
    fromMock.mockReturnValue(
      chainSelectEqOrder({
        data: [
          { storage_path: "uid/1.jpg", position: 1 },
          { storage_path: "uid/2.jpg", position: 2 },
          { storage_path: "uid/3.jpg", position: 3 },
          { storage_path: "uid/4.jpg", position: 4 },
        ],
        error: null,
      }),
    );
    const downloadMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "object not found" },
    });
    storageFromMock.mockReturnValue({ download: downloadMock });

    await expect(loadPhotosForUser("uid")).rejects.toThrow(/object not found/);
  });

  it("throws when storage returns null blob without error", async () => {
    fromMock.mockReturnValue(
      chainSelectEqOrder({
        data: [
          { storage_path: "uid/1.jpg", position: 1 },
          { storage_path: "uid/2.jpg", position: 2 },
          { storage_path: "uid/3.jpg", position: 3 },
          { storage_path: "uid/4.jpg", position: 4 },
        ],
        error: null,
      }),
    );
    const downloadMock = vi
      .fn()
      .mockResolvedValue({ data: null, error: null });
    storageFromMock.mockReturnValue({ download: downloadMock });

    await expect(loadPhotosForUser("uid")).rejects.toThrow(/no blob/);
  });
});
