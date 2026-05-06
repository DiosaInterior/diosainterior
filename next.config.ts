import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Sentry envuelve la config para subir source maps en build y crear la
// route de tunneling. Sin SENTRY_AUTH_TOKEN no sube source maps (no
// rompe build). Sin SENTRY_ORG/SENTRY_PROJECT igual genera bundle.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Sube un set más amplio de archivos de cliente para mejor resolución
  // de stack traces.
  widenClientFileUpload: true,

  // Crea una route /monitoring/* para evadir ad-blockers que bloquean
  // requests a sentry.io.
  tunnelRoute: "/monitoring",

  // Suprime output del plugin fuera de CI.
  silent: !process.env.CI,
});
