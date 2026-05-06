import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resuelve los `paths` definidos en tsconfig.json (ej. "@/*" → "./*").
    // Soporte nativo de Vite — no requiere vite-tsconfig-paths.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // tests/e2e/ corre con Playwright en otro pipeline.
    exclude: ["node_modules", ".next", "tests/e2e/**"],
  },
});
