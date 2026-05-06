// =====================================================================
// Sentry — Node.js server runtime
// =====================================================================
// Sin SENTRY_DSN el SDK no se inicializa.
// =====================================================================

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Adjunta valores de variables locales a los stack frames (server only)
    includeLocalVariables: true,
  });
}
