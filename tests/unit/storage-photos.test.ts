import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock global de @/lib/db/server: el helper createClient devuelve un
// supabase fake que vamos configurando por test. vi.hoisted nos da las
// refs antes del hoist de vi.mock — sin esto, la factory no puede ver
// las vars top-level (Cannot access ... before initialization).
const supa = vi.hoisted(() => {
  const client = {
    from: vi.fn(),
    storage: { from: vi.fn() },
  };
  return { client };
});

vi.mock("@/lib/db/server", () => ({
  createClient: vi.fn(async () => supa.client),
}));

import {
  PHOTO_SLOTS,
  MAX_FILE_SIZE_BYTES,
  SIGNED_URL_TTL_SECONDS,
  isAllowedMime,
  uploadPhoto,
  deletePhoto,
  getUserPhotos,
  getSignedPhotoUrl,
  type PhotoPosition,
  type PhotoSlotKey,
  type PhotoSlotBadge,
} from "@/lib/storage/photos";

// ---------------------------------------------------------------------
// Helpers de mock — cada test arma fresh chains
// ---------------------------------------------------------------------

type TableChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

type Bucket = {
  upload: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  createSignedUrl: ReturnType<typeof vi.fn>;
};

function setupSupabase(): { table: TableChain; bucket: Bucket } {
  const table: TableChain = {
    select: vi.fn(),
    eq: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  // chainable methods devuelven el mismo table para emular fluent API
  table.select.mockReturnValue(table);
  table.eq.mockReturnValue(table);
  table.upsert.mockReturnValue(table);
  table.delete.mockReturnValue(table);
  table.order.mockReturnValue(table);

  const bucket: Bucket = {
    upload: vi.fn(),
    remove: vi.fn(),
    createSignedUrl: vi.fn(),
  };

  supa.client.from.mockReturnValue(table);
  supa.client.storage.from.mockReturnValue(bucket);

  return { table, bucket };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------
// PHOTO_SLOTS
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// Tipos derivados (compile-time)
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// Validators puros
// ---------------------------------------------------------------------

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

describe("SIGNED_URL_TTL_SECONDS", () => {
  it("es 3600 (1 hora)", () => {
    expect(SIGNED_URL_TTL_SECONDS).toBe(3600);
  });
});

// ---------------------------------------------------------------------
// uploadPhoto — validators (sin tocar Supabase)
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// uploadPhoto — orphan cleanup (con mock de Supabase)
// ---------------------------------------------------------------------

const photoRowFor = (path: string) => ({
  id: "photo-id",
  user_id: "abc-uuid",
  position: 1,
  storage_path: path,
  uploaded_at: "2026-05-06T00:00:00Z",
});

describe("uploadPhoto — orphan cleanup en cambio de extensión", () => {
  it("borra archivo viejo si la extensión cambió respecto al previo", async () => {
    const { table, bucket } = setupSupabase();

    table.maybeSingle.mockResolvedValue({
      data: { storage_path: "abc-uuid/1.jpg" },
      error: null,
    });
    bucket.remove.mockResolvedValue({ data: null, error: null });
    bucket.upload.mockResolvedValue({ data: null, error: null });
    table.single.mockResolvedValue({
      data: photoRowFor("abc-uuid/1.png"),
      error: null,
    });

    const file = new File(["data"], "x.png", { type: "image/png" });
    const result = await uploadPhoto(file, 1, "abc-uuid");

    expect(bucket.remove).toHaveBeenCalledWith(["abc-uuid/1.jpg"]);
    expect(bucket.upload).toHaveBeenCalledWith(
      "abc-uuid/1.png",
      file,
      expect.objectContaining({ upsert: true, contentType: "image/png" }),
    );
    expect(result.ok).toBe(true);
  });

  it("no llama remove si la extensión coincide con el previo", async () => {
    const { table, bucket } = setupSupabase();

    table.maybeSingle.mockResolvedValue({
      data: { storage_path: "abc-uuid/1.png" },
      error: null,
    });
    bucket.upload.mockResolvedValue({ data: null, error: null });
    table.single.mockResolvedValue({
      data: photoRowFor("abc-uuid/1.png"),
      error: null,
    });

    const file = new File(["data"], "x.png", { type: "image/png" });
    const result = await uploadPhoto(file, 1, "abc-uuid");

    expect(bucket.remove).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it("no llama remove si no había foto previa en ese slot", async () => {
    const { table, bucket } = setupSupabase();

    table.maybeSingle.mockResolvedValue({ data: null, error: null });
    bucket.upload.mockResolvedValue({ data: null, error: null });
    table.single.mockResolvedValue({
      data: photoRowFor("abc-uuid/1.jpg"),
      error: null,
    });

    const file = new File(["data"], "x.jpg", { type: "image/jpeg" });
    const result = await uploadPhoto(file, 1, "abc-uuid");

    expect(bucket.remove).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------
// getSignedPhotoUrl
// ---------------------------------------------------------------------

describe("getSignedPhotoUrl", () => {
  it("devuelve la URL firmada en éxito y usa TTL de 1 hora", async () => {
    const { bucket } = setupSupabase();
    bucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example.com/path?token=xxx" },
      error: null,
    });

    const url = await getSignedPhotoUrl("abc-uuid/1.jpg");
    expect(url).toBe("https://signed.example.com/path?token=xxx");
    expect(bucket.createSignedUrl).toHaveBeenCalledWith(
      "abc-uuid/1.jpg",
      SIGNED_URL_TTL_SECONDS,
    );
  });

  it("devuelve null si Supabase retorna error (defensivo, no throw)", async () => {
    const { bucket } = setupSupabase();
    bucket.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Object not found" },
    });

    const url = await getSignedPhotoUrl("abc-uuid/1.jpg");
    expect(url).toBeNull();
  });
});

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

describe("Exports", () => {
  it("uploadPhoto, deletePhoto, getUserPhotos, getSignedPhotoUrl son funciones async", () => {
    expect(typeof uploadPhoto).toBe("function");
    expect(typeof deletePhoto).toBe("function");
    expect(typeof getUserPhotos).toBe("function");
    expect(typeof getSignedPhotoUrl).toBe("function");
  });
});
