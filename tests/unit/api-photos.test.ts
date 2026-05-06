import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

// Mocks: vi.hoisted para que la factory del vi.mock pueda capturar
// las refs antes del hoist.
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  uploadPhoto: vi.fn(),
  deletePhoto: vi.fn(),
  getSignedPhotoUrl: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  getUser: mocks.getUser,
  requireUser: vi.fn(),
}));

vi.mock("@/lib/storage/photos", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage/photos")>();
  return {
    ...actual,
    uploadPhoto: mocks.uploadPhoto,
    deletePhoto: mocks.deletePhoto,
    getSignedPhotoUrl: mocks.getSignedPhotoUrl,
  };
});

import { POST as uploadPOST } from "@/app/api/photos/upload/route";
import { POST as deletePOST } from "@/app/api/photos/delete/route";

const fakeUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "ana@example.com",
} as unknown as User;

const fakePhotoRow = {
  id: "photo-1",
  user_id: fakeUser.id,
  position: 1,
  storage_path: `${fakeUser.id}/1.png`,
  uploaded_at: "2026-05-06T00:00:00Z",
};

function buildUploadRequest(opts: {
  file?: File | string | null;
  position?: string | null;
  body?: BodyInit | null;
}): Request {
  if (opts.body !== undefined) {
    return new Request("http://localhost/api/photos/upload", {
      method: "POST",
      body: opts.body,
    });
  }
  const fd = new FormData();
  if (opts.file instanceof File) fd.append("file", opts.file);
  else if (typeof opts.file === "string") fd.append("file", opts.file);
  if (opts.position !== undefined && opts.position !== null) {
    fd.append("position", opts.position);
  }
  return new Request("http://localhost/api/photos/upload", {
    method: "POST",
    body: fd,
  });
}

function buildDeleteRequest(body: unknown, contentType = "application/json"): Request {
  return new Request("http://localhost/api/photos/delete", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue(fakeUser);
});

// =====================================================================
// POST /api/photos/upload
// =====================================================================

describe("POST /api/photos/upload", () => {
  it("retorna 401 unauthenticated si no hay sesión", async () => {
    mocks.getUser.mockResolvedValue(null);
    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "unauthenticated" });
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it("retorna 400 no_file si FormData no trae un File", async () => {
    const res = await uploadPOST(buildUploadRequest({ position: "1" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "no_file" });
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it("retorna 400 no_file si 'file' es string en vez de File", async () => {
    const res = await uploadPOST(
      buildUploadRequest({ file: "not-a-file", position: "1" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "no_file" });
  });

  it("retorna 400 invalid_position si position fuera de 1-4", async () => {
    const file = new File(["x"], "x.png", { type: "image/png" });
    for (const bad of ["0", "5", "abc", ""]) {
      const res = await uploadPOST(
        buildUploadRequest({ file, position: bad }),
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        ok: false,
        error: "invalid_position",
      });
    }
  });

  it("retorna 400 invalid_position si position no viene", async () => {
    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      error: "invalid_position",
    });
  });

  it("retorna 201 con photo + signedUrl en éxito", async () => {
    mocks.uploadPhoto.mockResolvedValue({ ok: true, photo: fakePhotoRow });
    mocks.getSignedPhotoUrl.mockResolvedValue("https://signed.example/x");

    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({
      ok: true,
      photo: fakePhotoRow,
      signedUrl: "https://signed.example/x",
    });
    expect(mocks.uploadPhoto).toHaveBeenCalledWith(file, 1, fakeUser.id);
    expect(mocks.getSignedPhotoUrl).toHaveBeenCalledWith(
      fakePhotoRow.storage_path,
    );
  });

  it("retorna 201 con signedUrl=null si la firma falla", async () => {
    mocks.uploadPhoto.mockResolvedValue({ ok: true, photo: fakePhotoRow });
    mocks.getSignedPhotoUrl.mockResolvedValue(null);

    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.signedUrl).toBeNull();
  });

  it("mapea invalid_mime → 400", async () => {
    mocks.uploadPhoto.mockResolvedValue({ ok: false, error: "invalid_mime" });
    const file = new File(["x"], "x.gif", { type: "image/gif" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_mime");
  });

  it("mapea file_too_large → 413", async () => {
    mocks.uploadPhoto.mockResolvedValue({
      ok: false,
      error: "file_too_large",
    });
    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe("file_too_large");
  });

  it("mapea storage_failed → 500 con message", async () => {
    mocks.uploadPhoto.mockResolvedValue({
      ok: false,
      error: "storage_failed",
      message: "bucket exploded",
    });
    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("storage_failed");
    expect(json.message).toBe("bucket exploded");
  });

  it("mapea db_failed → 500", async () => {
    mocks.uploadPhoto.mockResolvedValue({ ok: false, error: "db_failed" });
    const file = new File(["x"], "x.png", { type: "image/png" });
    const res = await uploadPOST(buildUploadRequest({ file, position: "1" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("db_failed");
  });
});

// =====================================================================
// POST /api/photos/delete
// =====================================================================

describe("POST /api/photos/delete", () => {
  it("retorna 401 unauthenticated si no hay sesión", async () => {
    mocks.getUser.mockResolvedValue(null);
    const res = await deletePOST(buildDeleteRequest({ position: 1 }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: "unauthenticated" });
    expect(mocks.deletePhoto).not.toHaveBeenCalled();
  });

  it("retorna 400 invalid_body si el JSON está malformado", async () => {
    const res = await deletePOST(buildDeleteRequest("{invalid json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "invalid_body" });
    expect(mocks.deletePhoto).not.toHaveBeenCalled();
  });

  it("retorna 400 invalid_body si el body está vacío", async () => {
    const res = await deletePOST(buildDeleteRequest(""));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_body");
  });

  it("retorna 400 invalid_position si position falta o está fuera de rango", async () => {
    for (const bad of [{}, { position: 0 }, { position: 5 }, { position: "abc" }]) {
      const res = await deletePOST(buildDeleteRequest(bad));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("invalid_position");
    }
  });

  it("retorna 200 ok cuando deletePhoto OK (incluyendo idempotente sin foto)", async () => {
    mocks.deletePhoto.mockResolvedValue({ ok: true });
    const res = await deletePOST(buildDeleteRequest({ position: 2 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.deletePhoto).toHaveBeenCalledWith(2, fakeUser.id);
  });

  it("mapea storage_failed → 500", async () => {
    mocks.deletePhoto.mockResolvedValue({
      ok: false,
      error: "storage_failed",
      message: "remove rejected",
    });
    const res = await deletePOST(buildDeleteRequest({ position: 1 }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("storage_failed");
    expect(json.message).toBe("remove rejected");
  });

  it("mapea db_failed → 500", async () => {
    mocks.deletePhoto.mockResolvedValue({ ok: false, error: "db_failed" });
    const res = await deletePOST(buildDeleteRequest({ position: 1 }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("db_failed");
  });
});
