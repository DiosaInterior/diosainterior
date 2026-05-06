import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { User } from "@supabase/supabase-js";
import type { Photo } from "@/lib/storage/photos";

// Mocks: vi.hoisted para que la factory pueda capturar refs antes del
// hoist. Mockeamos requireUser/getUser de @/lib/auth/server y
// getUserPhotos/getSignedPhotoUrl de @/lib/storage/photos.
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUser: vi.fn(),
  getUserPhotos: vi.fn(),
  getSignedPhotoUrl: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: mocks.requireUser,
  getUser: mocks.getUser,
}));

vi.mock("@/lib/storage/photos", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage/photos")>();
  return {
    ...actual,
    getUserPhotos: mocks.getUserPhotos,
    getSignedPhotoUrl: mocks.getSignedPhotoUrl,
  };
});

import UploadPage from "@/app/(app)/upload/page";

const fakeUser = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "ana@example.com",
} as unknown as User;

function fakePhoto(position: 1 | 2 | 3 | 4): Photo {
  return {
    id: `p-${position}`,
    user_id: fakeUser.id,
    position,
    storage_path: `${fakeUser.id}/${position}.jpg`,
    uploaded_at: "2026-05-06T00:00:00Z",
  };
}

type UploaderProps = {
  initialPhotos: Array<{ photo: Photo; signedUrl: string | null }>;
  initialToast?: string;
};

// La page recibe searchParams como Promise (Next 15+). Helper para
// construir el arg desde un objeto plano.
function callPage(params: { canceled?: string } = {}) {
  return UploadPage({ searchParams: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue(fakeUser);
  mocks.getUserPhotos.mockResolvedValue([]);
  mocks.getSignedPhotoUrl.mockResolvedValue(null);
});

describe("/upload page", () => {
  it("invoca requireUser y getUserPhotos con el id del usuario", async () => {
    await callPage();
    expect(mocks.requireUser).toHaveBeenCalledOnce();
    expect(mocks.getUserPhotos).toHaveBeenCalledWith(fakeUser.id);
  });

  it("no llama getSignedPhotoUrl si la usuaria no tiene fotos previas", async () => {
    await callPage();
    expect(mocks.getSignedPhotoUrl).not.toHaveBeenCalled();
  });

  it("genera signed URL para cada foto previa", async () => {
    mocks.getUserPhotos.mockResolvedValue([fakePhoto(1), fakePhoto(3)]);
    mocks.getSignedPhotoUrl
      .mockResolvedValueOnce("https://signed/1")
      .mockResolvedValueOnce("https://signed/3");
    await callPage();
    expect(mocks.getSignedPhotoUrl).toHaveBeenCalledTimes(2);
    expect(mocks.getSignedPhotoUrl).toHaveBeenCalledWith(`${fakeUser.id}/1.jpg`);
    expect(mocks.getSignedPhotoUrl).toHaveBeenCalledWith(`${fakeUser.id}/3.jpg`);
  });

  it("renderiza <PhotoUploader /> con initialPhotos=[] cuando no hay fotos", async () => {
    const tree = (await callPage()) as ReactElement<UploaderProps>;
    expect(tree).toBeTruthy();
    expect(tree.props.initialPhotos).toEqual([]);
  });

  it("hidrata initialPhotos con la foto + signedUrl correspondiente", async () => {
    const photo = fakePhoto(1);
    mocks.getUserPhotos.mockResolvedValue([photo]);
    mocks.getSignedPhotoUrl.mockResolvedValue("https://signed/1");

    const tree = (await callPage()) as ReactElement<UploaderProps>;
    expect(tree.props.initialPhotos).toHaveLength(1);
    expect(tree.props.initialPhotos[0].photo).toEqual(photo);
    expect(tree.props.initialPhotos[0].signedUrl).toBe("https://signed/1");
  });

  it("propaga signedUrl=null si getSignedPhotoUrl falló (UX defensiva)", async () => {
    const photo = fakePhoto(2);
    mocks.getUserPhotos.mockResolvedValue([photo]);
    mocks.getSignedPhotoUrl.mockResolvedValue(null);

    const tree = (await callPage()) as ReactElement<UploaderProps>;
    expect(tree.props.initialPhotos[0].signedUrl).toBeNull();
  });

  it("pasa initialToast cuando searchParams.canceled === '1'", async () => {
    const tree = (await callPage({ canceled: "1" })) as ReactElement<UploaderProps>;
    expect(tree.props.initialToast).toBe(
      "Pago cancelado. Cuando estés lista, vuelve a continuar.",
    );
  });

  it("no pasa initialToast si searchParams.canceled está ausente", async () => {
    const tree = (await callPage()) as ReactElement<UploaderProps>;
    expect(tree.props.initialToast).toBeUndefined();
  });

  it("no pasa initialToast si canceled tiene otro valor", async () => {
    const tree = (await callPage({ canceled: "false" })) as ReactElement<UploaderProps>;
    expect(tree.props.initialToast).toBeUndefined();
  });
});
