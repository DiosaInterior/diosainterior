import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

// vi.mock se hoistea por encima de los `const` del módulo, así que las
// fábricas no pueden capturar variables top-level. vi.hoisted nos da
// referencias mutables disponibles tanto dentro de la factory como en
// los tests para configurar comportamiento por caso.
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => mocks);

import UploadPage from "@/app/(app)/upload/page";

const fakeUser = {
  id: "fake-uuid",
  email: "ana.lopez@example.com",
  user_metadata: { given_name: "Ana", full_name: "Ana López" },
} as unknown as User;

describe("/upload page", () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.requireUser.mockResolvedValue(fakeUser);
  });

  it("invoca requireUser y renderiza la bienvenida con el given_name", async () => {
    const tree = await UploadPage();
    expect(mocks.requireUser).toHaveBeenCalledOnce();
    expect(tree).toBeTruthy();
    const json = JSON.stringify(tree);
    expect(json).toContain("Bienvenida");
    expect(json).toContain("Ana");
    expect(json).toContain("Aquí subirás tus 4 fotos en el siguiente paso");
  });

  it("cae al primer nombre del full_name si no hay given_name", async () => {
    const userSinGivenName = {
      id: "fake-2",
      email: "carmen.diaz@example.com",
      user_metadata: { full_name: "Carmen Díaz" },
    } as unknown as User;
    mocks.requireUser.mockResolvedValueOnce(userSinGivenName);

    const tree = await UploadPage();
    const json = JSON.stringify(tree);
    expect(json).toContain("Carmen");
  });

  it("cae al local-part del email si no hay metadata de nombre", async () => {
    const userSinNombre = {
      id: "fake-3",
      email: "valeria@example.com",
      user_metadata: {},
    } as unknown as User;
    mocks.requireUser.mockResolvedValueOnce(userSinNombre);

    const tree = await UploadPage();
    const json = JSON.stringify(tree);
    expect(json).toContain("valeria");
  });
});
