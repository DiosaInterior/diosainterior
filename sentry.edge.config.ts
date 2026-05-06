// =====================================================================
// Sentry — Edge runtime (middleware, edge route handlers)
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
  });
}
