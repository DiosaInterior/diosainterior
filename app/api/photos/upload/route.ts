// POST /api/photos/upload
// FormData { file: File, position: "1"|"2"|"3"|"4" }
//
// 401 si no hay sesión. 400 si position fuera de rango / file falta.
// 413 si el archivo excede 10 MB. 400 si MIME no permitido. 500 si
// storage o DB fallan. 201 + { ok:true, photo, signedUrl } en éxito.
//
// La validación de MIME / tamaño la hace uploadPhoto antes de tocar IO,
// igual que el orphan cleanup (si la usuaria reemplaza la foto cambiando
// extensión).

import { NextResponse } from "next/server";
import { z } from "zod";

import { getUser } from "@/lib/auth/server";
import type { PhotoUploadResponse } from "@/lib/api/photos.types";
import {
  getSignedPhotoUrl,
  uploadPhoto,
  type PhotoPosition,
  type UploadErrorCode,
} from "@/lib/storage/photos";

const positionSchema = z.coerce.number().int().min(1).max(4);

function uploadStatusFor(code: UploadErrorCode): number {
  switch (code) {
    case "invalid_mime":
      return 400;
    case "file_too_large":
      return 413;
    case "storage_failed":
    case "db_failed":
      return 500;
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse<PhotoUploadResponse>> {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "no_file" },
      { status: 400 },
    );
  }

  const positionResult = positionSchema.safeParse(formData.get("position"));
  if (!positionResult.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_position" },
      { status: 400 },
    );
  }
  // .int().min(1).max(4) garantiza que el número está en {1,2,3,4}.
  const position = positionResult.data as PhotoPosition;

  const result = await uploadPhoto(fileEntry, position, user.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, message: result.message },
      { status: uploadStatusFor(result.error) },
    );
  }

  const signedUrl = await getSignedPhotoUrl(result.photo.storage_path);
  return NextResponse.json(
    { ok: true, photo: result.photo, signedUrl },
    { status: 201 },
  );
}
