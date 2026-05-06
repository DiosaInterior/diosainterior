import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resuelve los `paths` definidos en tsconfig.json (ej. "@/*" → "./*").
    // Soporte nativo de Vite — no requiere vite-tsconfig-paths.
    tsconfigPaths: true,
    alias: {
      // server-only lanza al importarlo fuera de un build de Next.
      // En tests lo aliasamos a un stub vacío para que los módulos
      // server-side carguen sin crashear. La protección real corre en
      // build de producción contra el paquete genuino.
      "server-only": fileURLToPath(
        new URL("./tests/_stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    // tests/e2e/ corre con Playwright en otro pipeline.
    exclude: ["node_modules", ".next", "tests/e2e/**"],
  },
});
