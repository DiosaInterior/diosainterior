// POST /api/photos/upload
// FormData { file: File, position: "1"|"2"|"3"|"4" }
//
// 401 si no hay sesión. 400 si position fuera de rango / file falta.
// 413 si el archivo excede 10 MB. 400 si MIME no permitido. 422 si la
// conversión HEIC→JPEG falla. 500 si storage o DB fallan.
// 201 + { ok:true, photo, signedUrl } en éxito.
//
// HEIC normalization (F.0.2):
//  - iPhone sube en HEIC/HEIF con compresión HEVC; navegadores no lo
//    renderizan en <img>; Anthropic API tampoco lo acepta en Bloque F.
//  - Detectamos HEIC por mime (image/heic, image/heif) Y por extensión
//    (.heic, .heif) — algunos iPhones reportan mime incorrecto.
//  - Pipeline de conversión en dos pasos:
//      1) heic-convert (libheif WASM) decodifica HEVC → JPEG raw.
//      2) sharp re-encoda con quality:88 + mozjpeg para control fino.
//    sharp solo no alcanza: el binario prebuilt no incluye codec HEVC
//    (limitación documentada por restricciones de patentes — libheif/
//    libde265/x265 no van bundled). heic-convert provee el decoder
//    WASM sin deps nativas adicionales.
//  - Conversión envuelta en try/catch: cualquier paso que lance →
//    422 conversion_failed con copy editorial mapeado en _errors.ts.
//
// runtime "nodejs": sharp usa binarios libvips y heic-convert corre
// libheif via WASM con APIs Node. Ninguno funciona en Edge runtime.

import { NextResponse } from "next/server";
import convert from "heic-convert";
import sharp from "sharp";
import { z } from "zod";

import { getUser } from "@/lib/auth/server";
import type { PhotoUploadResponse } from "@/lib/api/photos.types";
import {
  getSignedPhotoUrl,
  uploadPhoto,
  type PhotoPosition,
  type UploadErrorCode,
} from "@/lib/storage/photos";

export const runtime = "nodejs";

const positionSchema = z.coerce.number().int().min(1).max(4);

const JPEG_QUALITY = 88;

type UploadOrApiError = UploadErrorCode | "conversion_failed";

function uploadStatusFor(code: UploadOrApiError): number {
  switch (code) {
    case "invalid_mime":
      return 400;
    case "file_too_large":
      return 413;
    case "conversion_failed":
      return 422;
    case "storage_failed":
    case "db_failed":
      return 500;
  }
}

function isHeicFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime === "image/heic" || mime === "image/heif") return true;
  // Algunos iPhones reportan mime vacío o application/octet-stream;
  // chequeamos extensión como fallback.
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Step 1: decodificar HEVC con heic-convert (libheif WASM). El JPEG
  // que devuelve es funcional pero con calidad fija — pasamos a sharp
  // para re-encodar con control. quality:1 acá maximiza calidad antes
  // del re-encode (evita pérdida acumulada en 2 pasos).
  const decodedJpeg = await convert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 1,
  });

  // Step 2: re-encodar con sharp (mozjpeg encoder, quality:88) para
  // tamaño/calidad balance. Bonus: pipeline de sharp queda listo para
  // resize/format negotiation futuros sin tocar la decodificación.
  const finalBuffer = await sharp(Buffer.from(decodedJpeg))
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  // Renombrar: "foo.heic" → "foo.jpg", "x.HEIF" → "x.jpg".
  const baseName = file.name.replace(/\.(heic|heif)$/i, "");
  const newName = baseName.length > 0 ? `${baseName}.jpg` : "photo.jpg";
  // new File() acepta BlobPart = ArrayBufferView<ArrayBuffer>. Buffer
  // expone .buffer como ArrayBufferLike (puede ser SharedArrayBuffer en
  // teoría), TS strict lo rechaza. Wrap en Uint8Array copia los bytes
  // a un fresh ArrayBuffer plain, satisfaciendo el typing.
  return new File([new Uint8Array(finalBuffer)], newName, {
    type: "image/jpeg",
  });
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

  // Normalización HEIC: si aplica, sustituimos fileEntry por su versión
  // JPEG ANTES de pasar a uploadPhoto. El helper hace su propia
  // validación de mime/tamaño contra el resultado convertido.
  let processedFile: File = fileEntry;
  if (isHeicFile(fileEntry)) {
    try {
      processedFile = await convertHeicToJpeg(fileEntry);
    } catch (err) {
      console.error("[upload] HEIC→JPEG conversion failed", {
        userId: user.id,
        fileName: fileEntry.name,
        fileType: fileEntry.type,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        {
          ok: false,
          error: "conversion_failed",
          message:
            "No pudimos procesar esta imagen. Intenta con una foto distinta.",
        },
        { status: uploadStatusFor("conversion_failed") },
      );
    }
  }

  const result = await uploadPhoto(processedFile, position, user.id);
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
