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

// heic-convert se mockea como una función simple — devuelve ArrayBuffer
// (output JPEG decodificado de HEVC). Tests per-case configuran resolve
// o reject según el escenario.
const heicConvert = vi.hoisted(() => vi.fn());
vi.mock("heic-convert", () => ({ default: heicConvert }));

// sharp se mockea separado: el fluent chain `sharp(buf).jpeg(opts).toBuffer()`
// se modela con tres vi.fn encadenados. Tests configuran toBuffer per-case.
const sharpChain = vi.hoisted(() => {
  const toBuffer = vi.fn();
  const jpeg = vi.fn(() => ({ toBuffer }));
  const sharp = vi.fn(() => ({ jpeg }));
  return { sharp, jpeg, toBuffer };
});

vi.mock("sharp", () => ({ default: sharpChain.sharp }));

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
    // El roundtrip Request → formData() reconstruye una nueva File con
    // lastModified ≠ al original (1 ms de diferencia). Verificamos los
    // campos manualmente en vez de comparar la instancia.
    expect(mocks.uploadPhoto).toHaveBeenCalledOnce();
    const [calledFile, calledPos, calledUser] =
      mocks.uploadPhoto.mock.calls[0];
    expect(calledFile).toBeInstanceOf(File);
    expect(calledFile.name).toBe("x.png");
    expect(calledFile.type).toBe("image/png");
    expect(calledPos).toBe(1);
    expect(calledUser).toBe(fakeUser.id);
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

  // -------------------------------------------------------------------
  // F.0.2 HEIC normalization (heic-convert decode → sharp re-encode)
  // -------------------------------------------------------------------

  it("HEIC mime/.HEIC ext: heic-convert decodifica primero, luego sharp re-encoda", async () => {
    const decodedJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    const finalJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    heicConvert.mockResolvedValue(decodedJpeg);
    sharpChain.toBuffer.mockResolvedValue(Buffer.from(finalJpeg));
    mocks.uploadPhoto.mockResolvedValue({ ok: true, photo: fakePhotoRow });
    mocks.getSignedPhotoUrl.mockResolvedValue("https://signed/x");

    const heicFile = new File([new Uint8Array([0, 1, 2])], "IMG_0001.HEIC", {
      type: "image/heic",
    });
    const res = await uploadPOST(
      buildUploadRequest({ file: heicFile, position: "1" }),
    );

    expect(res.status).toBe(201);
    // Step 1: heic-convert con format JPEG y quality 1 (max para evitar
    // pérdida acumulada antes del re-encode de sharp).
    expect(heicConvert).toHaveBeenCalledOnce();
    expect(heicConvert).toHaveBeenCalledWith(
      expect.objectContaining({ format: "JPEG", quality: 1 }),
    );
    // Step 2: sharp re-encoda con quality:88 + mozjpeg.
    expect(sharpChain.sharp).toHaveBeenCalledOnce();
    expect(sharpChain.jpeg).toHaveBeenCalledWith({
      quality: 88,
      mozjpeg: true,
    });
    // uploadPhoto recibió el File final con type image/jpeg y nombre .jpg.
    expect(mocks.uploadPhoto).toHaveBeenCalledOnce();
    const [calledFile, calledPos, calledUser] =
      mocks.uploadPhoto.mock.calls[0];
    expect(calledFile).toBeInstanceOf(File);
    expect(calledFile.type).toBe("image/jpeg");
    expect(calledFile.name).toBe("IMG_0001.jpg");
    expect(calledPos).toBe(1);
    expect(calledUser).toBe(fakeUser.id);
  });

  it("HEIC detectado por extensión .heif aunque mime sea octet-stream", async () => {
    heicConvert.mockResolvedValue(new Uint8Array([0xff, 0xd8]).buffer);
    sharpChain.toBuffer.mockResolvedValue(Buffer.from([0xff, 0xd8]));
    mocks.uploadPhoto.mockResolvedValue({ ok: true, photo: fakePhotoRow });
    mocks.getSignedPhotoUrl.mockResolvedValue("https://signed/x");

    const heicFile = new File([new Uint8Array([0])], "vacation.heif", {
      type: "application/octet-stream",
    });
    const res = await uploadPOST(
      buildUploadRequest({ file: heicFile, position: "1" }),
    );

    expect(res.status).toBe(201);
    expect(heicConvert).toHaveBeenCalledOnce();
    expect(sharpChain.sharp).toHaveBeenCalledOnce();
    const calledFile = mocks.uploadPhoto.mock.calls[0][0];
    expect(calledFile.name).toBe("vacation.jpg");
    expect(calledFile.type).toBe("image/jpeg");
  });

  it("HEIC válido → output File es image/jpeg con extensión .jpg", async () => {
    heicConvert.mockResolvedValue(new Uint8Array([0xff, 0xd8]).buffer);
    sharpChain.toBuffer.mockResolvedValue(Buffer.from([0xff, 0xd8, 0x00]));
    mocks.uploadPhoto.mockResolvedValue({ ok: true, photo: fakePhotoRow });
    mocks.getSignedPhotoUrl.mockResolvedValue("https://signed/x");

    const heicFile = new File([new Uint8Array([0])], "selfie.HEIC", {
      type: "image/heic",
    });
    await uploadPOST(buildUploadRequest({ file: heicFile, position: "1" }));

    const calledFile = mocks.uploadPhoto.mock.calls[0][0];
    expect(calledFile).toBeInstanceOf(File);
    expect(calledFile.type).toBe("image/jpeg");
    expect(calledFile.name.toLowerCase()).toMatch(/\.jpg$/);
  });

  it("heic-convert throw (HEIC corrupto) → 422 conversion_failed con copy editorial", async () => {
    heicConvert.mockRejectedValue(
      new Error("heif: no compatible image found"),
    );

    const heicFile = new File([new Uint8Array([0])], "broken.heic", {
      type: "image/heic",
    });
    const res = await uploadPOST(
      buildUploadRequest({ file: heicFile, position: "1" }),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toEqual({
      ok: false,
      error: "conversion_failed",
      message:
        "No pudimos procesar esta imagen. Intenta con una foto distinta.",
    });
    // sharp NO debería haberse llamado (heic-convert es el primer paso).
    expect(sharpChain.sharp).not.toHaveBeenCalled();
    // uploadPhoto NO se llamó — abortamos antes de tocar Storage.
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it("sharp throw post heic-convert OK → 422 conversion_failed", async () => {
    heicConvert.mockResolvedValue(new Uint8Array([0xff, 0xd8]).buffer);
    sharpChain.toBuffer.mockRejectedValue(
      new Error("sharp: invalid jpeg input"),
    );

    const heicFile = new File([new Uint8Array([0])], "x.heic", {
      type: "image/heic",
    });
    const res = await uploadPOST(
      buildUploadRequest({ file: heicFile, position: "1" }),
    );

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("conversion_failed");
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it("JPEG: NO invoca heic-convert ni sharp, pasa File original a uploadPhoto (regression)", async () => {
    mocks.uploadPhoto.mockResolvedValue({ ok: true, photo: fakePhotoRow });
    mocks.getSignedPhotoUrl.mockResolvedValue("https://signed/x");

    const jpegFile = new File([new Uint8Array([0xff, 0xd8])], "x.jpg", {
      type: "image/jpeg",
    });
    const res = await uploadPOST(
      buildUploadRequest({ file: jpegFile, position: "1" }),
    );

    expect(res.status).toBe(201);
    expect(heicConvert).not.toHaveBeenCalled();
    expect(sharpChain.sharp).not.toHaveBeenCalled();

    const calledFile = mocks.uploadPhoto.mock.calls[0][0];
    expect(calledFile).toBeInstanceOf(File);
    expect(calledFile.type).toBe("image/jpeg");
    expect(calledFile.name).toBe("x.jpg");
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
