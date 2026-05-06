import type { NextConfig } from "next";

// Anclar el workspace root al directorio del proyecto.
// Sin esto, Turbopack sube en el árbol de directorios y encuentra
// otro package-lock.json en /Users/cesar/ (proyecto puppeteer ajeno),
// rompiendo file watching, module resolution y source maps.
const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
