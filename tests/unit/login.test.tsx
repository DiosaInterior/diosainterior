import { describe, expect, it, vi } from "vitest";

// getUser se mockea para que LoginPage NO redirija — el smoke test
// requiere que la página devuelva el árbol con <LoginScreen />.
vi.mock("@/lib/auth/server", () => ({
  getUser: vi.fn(async () => null),
  requireUser: vi.fn(),
}));

import LoginPage from "@/app/login/page";
import { LoginScreen } from "@/components/auth/LoginScreen";

describe("/login page", () => {
  it("renderiza un árbol React cuando no hay user autenticado", async () => {
    const tree = await LoginPage();
    expect(tree).toBeTruthy();
  });
});

describe("LoginScreen", () => {
  it("retorna un árbol React con los textos canónicos del S1", () => {
    const tree = LoginScreen();
    expect(tree).toBeTruthy();
    const json = JSON.stringify(tree);
    expect(json).toContain("Diosa");
    expect(json).toContain("Interior");
    expect(json).toContain("La primera guía de colorimetría diseñada");
    expect(json).toContain("Tu paleta");
    expect(json).toContain("6 colores exactamente tuyos");
    expect(json).toContain("Tu corte");
    expect(json).toContain("El que enmarca tu geometría");
    expect(json).toContain("Maquillaje");
    expect(json).toContain("Labial, rubor, sombras exactas");
    expect(json).toContain("Tu metal");
    expect(json).toContain("Cuál multiplica tu luz");
    expect(json).toContain("Iniciar sesión");
    expect(json).toContain("con Google");
    expect(json).toContain("Google protege toda tu información");
  });
});
