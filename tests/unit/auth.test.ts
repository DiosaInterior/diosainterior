import { describe, it, expect } from "vitest";
import * as authServer from "@/lib/auth/server";
import * as authClient from "@/lib/auth/client";

// Smoke tests: verifican que los módulos cargan y exponen los helpers.
// Pruebas reales de comportamiento llegan en C.6+ cuando haya páginas
// /login y /auth/callback que disparen estos helpers.

describe("lib/auth/server", () => {
  it("expone getUser y requireUser como funciones", () => {
    expect(typeof authServer.getUser).toBe("function");
    expect(typeof authServer.requireUser).toBe("function");
  });
});

describe("lib/auth/client", () => {
  it("expone signInWithGoogle y signOut como funciones", () => {
    expect(typeof authClient.signInWithGoogle).toBe("function");
    expect(typeof authClient.signOut).toBe("function");
  });
});
