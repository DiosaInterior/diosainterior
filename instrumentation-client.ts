// =====================================================================
// Sentry — Client (browser) runtime
// =====================================================================
// Sin NEXT_PUBLIC_SENTRY_DSN el SDK no se inicializa. Esto permite que
// el repo se clone y `npm run dev` corra sin cuenta Sentry.
// =====================================================================

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,

    // 100% en dev, 10% en producción
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Session Replay: 10% de todas las sesiones, 100% de las que tienen errores
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [Sentry.replayIntegration()],
  });
}

// Hook de transiciones de rutas en App Router. Sigue siendo un no-op
// si el init de arriba no corrió porque DSN estaba vacío.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
