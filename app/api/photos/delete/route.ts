// POST /api/photos/delete
// Body JSON: { position: 1|2|3|4 }
//
// 401 si no hay sesión. 400 si body no es JSON o position fuera de rango.
// 500 si storage o DB fallan. 200 + { ok:true } si la foto se borró
// (o ya no existía — deletePhoto es idempotente).

import { NextResponse } from "next/server";
import { z } from "zod";

import { getUser } from "@/lib/auth/server";
import type { PhotoDeleteResponse } from "@/lib/api/photos.types";
import {
  deletePhoto,
  type PhotoPosition,
} from "@/lib/storage/photos";

const bodySchema = z.object({
  position: z.coerce.number().int().min(1).max(4),
});

export async function POST(
  request: Request,
): Promise<NextResponse<PhotoDeleteResponse>> {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_position" },
      { status: 400 },
    );
  }
  const position = parsed.data.position as PhotoPosition;

  const result = await deletePhoto(position, user.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
