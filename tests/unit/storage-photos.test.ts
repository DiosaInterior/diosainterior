import { describe, expect, it } from "vitest";
import {
  PHOTO_SLOTS,
  MAX_FILE_SIZE_BYTES,
  isAllowedMime,
  uploadPhoto,
  deletePhoto,
  getUserPhotos,
  type PhotoPosition,
  type PhotoSlotKey,
  type PhotoSlotBadge,
} from "@/lib/storage/photos";

// Tests E2E reales (con mocks de Supabase / fixtures de Storage) llegan
// en Bloque H. Aquí cubrimos lo determinístico:
//  - shape y orden de PHOTO_SLOTS
//  - validators que corren ANTES de tocar Supabase (rechazo temprano)
//  - tipos derivados (compile-time check vía asignación)
//  - exports presentes

describe("PHOTO_SLOTS", () => {
  it("tiene exactamente 4 entradas", () => {
    expect(PHOTO_SLOTS).toHaveLength(4);
  });

  it("posiciones son 1,2,3,4 en orden", () => {
    expect(PHOTO_SLOTS.map((s) => s.position)).toEqual([1, 2, 3, 4]);
  });

  it("keys replican slide-3 V1: selfie_rostro/look_completo/luz_diferente/momento_favorita", () => {
    expect(PHOTO_SLOTS.map((s) => s.key)).toEqual([
      "selfie_rostro",
      "look_completo",
      "luz_diferente",
      "momento_favorita",
    ]);
  });

  it("cada entrada tiene label y sublabel no vacíos", () => {
    for (const slot of PHOTO_SLOTS) {
      expect(slot.label.length).toBeGreaterThan(0);
      expect(slot.sublabel.length).toBeGreaterThan(0);
    }
  });

  it("posición 1 (selfie de rostro) tiene badge 'clave'", () => {
    expect(PHOTO_SLOTS[0].badge).toBe("clave");
  });

  it("posiciones 2-4 tienen badge 'numbered'", () => {
    expect(PHOTO_SLOTS.slice(1).map((s) => s.badge)).toEqual([
      "numbered",
      "numbered",
      "numbered",
    ]);
  });

  it("textos canónicos del slide-3 V1 se mantienen exactos", () => {
    expect(PHOTO_SLOTS[0].label).toBe("Selfie de rostro");
    expect(PHOTO_SLOTS[0].sublabel).toBe("Sin filtro · cualquier lugar");
    expect(PHOTO_SLOTS[1].label).toBe("Look completo");
    expect(PHOTO_SLOTS[1].sublabel).toBe(
      "De cabeza a pies · ropa que te gusta",
    );
    expect(PHOTO_SLOTS[2].label).toBe("Luz diferente");
    expect(PHOTO_SLOTS[2].sublabel).toBe("Restaurante, exterior, oficina");
    expect(PHOTO_SLOTS[3].label).toBe("Tu momento favorita");
    expect(PHOTO_SLOTS[3].sublabel).toBe(
      "Evento, viaje — donde más te gustaste",
    );
  });
});

describe("Tipos derivados (compile-time)", () => {
  it("PhotoPosition acepta 1,2,3,4", () => {
    const positions: PhotoPosition[] = [1, 2, 3, 4];
    expect(positions).toEqual([1, 2, 3, 4]);
  });

  it("PhotoSlotKey acepta los 4 keys", () => {
    const keys: PhotoSlotKey[] = [
      "selfie_rostro",
      "look_completo",
      "luz_diferente",
      "momento_favorita",
    ];
    expect(keys).toHaveLength(4);
  });

  it("PhotoSlotBadge acepta 'clave' y 'numbered'", () => {
    const badges: PhotoSlotBadge[] = ["clave", "numbered"];
    expect(badges).toEqual(["clave", "numbered"]);
  });
});

describe("isAllowedMime", () => {
  it("acepta jpeg, png, heic, webp", () => {
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/heic")).toBe(true);
    expect(isAllowedMime("image/webp")).toBe(true);
  });

  it("rechaza otros formatos comunes", () => {
    expect(isAllowedMime("image/gif")).toBe(false);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("application/pdf")).toBe(false);
    expect(isAllowedMime("")).toBe(false);
  });
});

describe("MAX_FILE_SIZE_BYTES", () => {
  it("es 10 MB exactos (matches bucket file_size_limit)", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_FILE_SIZE_BYTES).toBe(10485760);
  });
});

describe("uploadPhoto — validators sin tocar Supabase", () => {
  it("rechaza MIME inválido con error invalid_mime", async () => {
    const file = new File(["fake bytes"], "test.gif", { type: "image/gif" });
    const result = await uploadPhoto(file, 1, "any-uuid-here");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_mime");
    }
  });

  it("rechaza file.type vacío con error invalid_mime", async () => {
    const file = new File(["fake bytes"], "test.bin", { type: "" });
    const result = await uploadPhoto(file, 1, "any-uuid-here");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_mime");
    }
  });

  it("rechaza archivos > 10 MB con error file_too_large", async () => {
    const oversized = new Uint8Array(MAX_FILE_SIZE_BYTES + 1);
    const file = new File([oversized], "huge.jpg", { type: "image/jpeg" });
    expect(file.size).toBe(MAX_FILE_SIZE_BYTES + 1);

    const result = await uploadPhoto(file, 1, "any-uuid-here");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("file_too_large");
    }
  });
});

describe("Exports", () => {
  it("uploadPhoto, deletePhoto, getUserPhotos son funciones async", () => {
    expect(typeof uploadPhoto).toBe("function");
    expect(typeof deletePhoto).toBe("function");
    expect(typeof getUserPhotos).toBe("function");
  });
});
